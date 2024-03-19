import { Router } from 'express';
import { uploader } from '../../utils.js';
import bodyParser from 'body-parser';
import fs from 'fs';
import __dirname from '../../utils.js';
import { socketServer } from '../app.js';
import { productsModel } from '../models/products.model.js';

const router = Router();

// Configurar el middleware body-parser para analizar el cuerpo de la solicitud en formato JSON. Agregue esto porque no me capturaba el request.body al crear un producto con postman
router.use(bodyParser.json());


//Ruta que nos muestra todos los productos
router.get('/', async (request, response) => {
	try {
		let products = await productsModel.find()
		if (!products) {
			products = [];
			response.send("Ooooh, parece que no hay productos disponibles.")
		} else {
			response.send(products)
		}
	} catch (error) {
		console.error("Error al intentar parsear el archivo array.json: " + error);
		response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error.</h2>')
	}
})

//Ruta que nos muestra un producto especifico dado su id(params)
router.get('/id/:pid', async (request, response) => {
	try {
		let products = await productsModel.find()

		//Esto es para ver si esta vacío el archivo
		if (products.length == 0) {
			return response.send('<h2 style="color: red">No hay productos disponibles, por lo tanto, no podemos ejecutar esto.</h2>');
		}

		let productId = request.params.pid
		const idSearch = await productsModel.findOne({ id: parseInt(productId) })
		if (idSearch) {
			return response.send(idSearch)
		}
		return response.send({ msg: `El producto con el id=${productId} no existe.` })
	} catch (error) {
		console.error("Ha surgido este error: " + error)
		response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo mostrar lo solicitado.</h2>')
	}
})


//Ruta para agregar un producto. Funciona con Moongose :)
router.post('/', uploader.array('files'), async (request, response) => {
	try {
		let products = await productsModel.find()
		const { title, description, code, price, stock, category } = request.body;
		if (!title || !description || !code || !price || !stock || !category) {
			if (request.files && request.files.length > 0) {
				//Esto es para evitar que se guarden archivos si los parametros no estan completos
				request.files.forEach(file => {
					fs.unlinkSync(file.path);
				});
			}
			return response.status(400).send({ status: "error", msg: "¡Oh oh! No se han completado todos los campos requeridos." });
		}

		const idGenerator = Math.floor(Math.random() * 10000)
		let idNewProduct = idGenerator
		//Esto es para garatizar que ningun id se repite
		if (products.length > 0) {
			const productsId = products.map(product => product.id)
			if (productsId.includes(idNewProduct)) {
				while (productsId.includes(idGenerator)) {
					idNewProduct = idGenerator
				}
			}
		}
		let categoryLC = category.toLowerCase()
		console.log(categoryLC)

		const status = true;
		let thumbnailImages = request.files ? request.files.map(file => `/${file.filename}`) : [] // Formatear la ruta de la thumbnail

		//monogo
		await productsModel.create({ id: idNewProduct, title, description, code, price, stock, category: categoryLC, thumbnail: thumbnailImages, status })
		products = await productsModel.find()
		socketServer.emit('updateProducts', products);//Esto es para el websocket

		return response.send({ status: "Success", msg: `Se ha creado un nuevo producto exitosamente con id=${idNewProduct} :)` });
	} catch (error) {
		console.error("Ha surgido este error: " + error);
		response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo crear un nuevo producto.</h2>');
	}
});


//Ruta para actualizar un producto. Funciona con Moongose :)
router.put('/:pid', async (request, response) => {
	try {
		let products = await productsModel.find()

		//Esto es para ver si esta vacío el archivo
		if (products.length < 0) {
			return response.send('<h2 style="color: red">No hay productos disponibles, por lo tanto, no podemos ejecutar esto.</h2>');
		}

		let productId = request.params.pid
		let productUpdate = request.body
		const productPosition = products.findIndex(prod => prod.id === parseInt(productId))

		if (productPosition < 0) { //Verificamos que el producto exista
			return response.status(202).send({ status: "info", error: `No se ha encontrado ningún producto con id=${productId}.` });
		}

		await productsModel.updateOne({ id: parseInt(productId) }, productUpdate)
		products = await productsModel.find() // Mando los productos actualizados al socket
		socketServer.emit('updateProducts', products);//esto lo agregue para que me actualice los productos en tiempo real

		return response.send({ status: "Success", message: "Se ha actualizado el producto con éxito :)", data: products[productPosition] })
	} catch (error) {
		console.error("Ha surgido este error: " + error)
		response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo actualizar el producto.</h2>')
	}
})


//Ruta para eliminar un producto. Funciona con Moongose :)
router.delete('/:pid', async (request, response) => {
	try {
		let products = await productsModel.find()
		let productId = request.params.pid
		let productsSize = products.length
		const productPosition = products.findIndex(prod => prod.id === parseInt(productId))

		if (productPosition < 0) { //Checamos que el producto exista
			return response.status(202).send({ status: "info", error: `No se ha encontrado ningún producto con id=${productId}.` });
		}

		const productToDelete = products[productPosition];
		if (productToDelete.thumbnail && productToDelete.thumbnail.length > 0) {
			productToDelete.thumbnail.forEach(image => {
				// Construimos la ruta absoluta, porque no me funcionaba de otra manera
				const imagePath = (__dirname + '/src/public/img' + image);
				if (fs.existsSync(imagePath)) {
					try {
						fs.unlinkSync(imagePath);
					} catch (error) {
						console.error(`Error al eliminar ${imagePath}: ${error}`);
					}
				} else {
					console.log(`${imagePath} no existe`);
				}
			});
		}

		await productsModel.deleteOne({ id: parseInt(productId) })
		products = await productsModel.find() // Mando los productos actualizados al socket

		if (products.length === productsSize) { //Si no se elimino el user, mostramos el siguiente error:
			return response.status(500).send({ status: "error", error: `¡oh oh! El producto con id=${productId} no se pudo borrar.` });
		}

		socketServer.emit('updateProducts', products);//Esto es para el websocket

		response.send({ status: "Success", message: `El producto con id=${productId} ha sido eliminado.` });
	} catch (error) {
		console.error("Ha surgido este error: " + error)
		response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo eliminar el producto.</h2>')
	}
})


//MOONGOSE -  Ruta que nos muestra los productos de la base de datos
router.get('/moongose', async (request, response) => {
	try {
		let productsDb = await productsModel.find()
		response.send({ message: "succes", payload: productsDb })
	}
	catch (error) {
		console.error("No se pudo obtener los productos con moongose debido a este error: " + error);
		response.status(500).send({ error: "No se pudo obtener los productos con moongose", message: error })
	}
})

export default router;