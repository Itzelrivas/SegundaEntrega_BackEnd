import { Router } from 'express';
import { cartsModel } from '../models/carts.model.js'
import { productsModel } from '../models/products.model.js';

const router = Router();

//Ruta para crear un nuevo carrito
router.post('/', async (request, response) => {
    try {
        let idCart
        do {
            idCart = Math.floor(Math.random() * 10000);
            const existingCart = await cartsModel.findOne({ id: idCart });
            if (!existingCart) {
                break;
            }
        } while (true);

        const cart = {
            id: idCart,
            products: []
        };
        await cartsModel.create(cart)
        return response.send(`Se ha creado un nuevo carrito con id=${idCart}`)
    } catch (error) {
        console.error("Ha surgido este error: " + error)
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo crear un carrito.</h2>')
    }
})

//Params que me muestra mi carrito con population
router.get('/:cid', async (request, response) => {
    try {
        const cartId = request.params.cid;
        const searchCart = await cartsModel.findOne({ id: parseInt(cartId) }).populate('products.product');
        if (!searchCart) {
            return response.status(404).send(`El carrito con id=${cartId} no fue encontrado`);
        }
        console.log(JSON.stringify(searchCart, null, '\t'));
        return response.send(searchCart);
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        return response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo mostrar el carrito con population.</h2>');
    }
});


//Ruta que agrega un producto especifico a un carrito específico
router.post('/:cid/product/:pid', async (request, response) => {
    try {
        const cartId = request.params.cid;
        const productId = request.params.pid;

        // Verificar si el carrito existe
        const cart = await cartsModel.findOne({ id: parseInt(cartId) });
        if (!cart) {
            return response.send(`El carrito con el id=${cartId} no existe.`);
        }

        // Verificar si el producto existe
        const product = await productsModel.findOne({ id: parseInt(productId) });
        if (!product) {
            return response.send(`El producto con el id=${productId} no existe.`);
        }

        // Verificar si el producto ya está en el carrito
        const existingProductIndex = cart.products.findIndex(item => item.product.toString() === product._id.toString());
        if (existingProductIndex !== -1) {
            // Si el producto ya está en el carrito, incrementar la cantidad
            cart.products[existingProductIndex].quantity++;
        } else {
            // Si el producto no está en el carrito, agregarlo al carrito con cantidad 1
            cart.products.push({ product: product._id, quantity: 1 });
        }

        // Actualizar el carrito en la base de datos
        await cartsModel.findOneAndUpdate({ id: parseInt(cartId) }, { products: cart.products });

        return response.send(`Se ha agregado el producto con el id=${productId} al carrito con id=${cartId}`);
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo agregar un producto al carrito.</h2>');
    }
});

//Ruta que elimina un producto especifico de un carrito específico
router.delete('/:cid/product/:pid', async (request, response) => {
    try {
        let cartId = request.params.cid
        let productId = request.params.pid
        let carts = await cartsModel.find()
        if (carts && carts.length > 0) {
            let idSearch = carts.find(cart => cart.id === parseInt(cartId)) //carrito que busco
            if (idSearch) {
                console.log(idSearch)
                let productsCart = idSearch.products //Productos del carrito
                console.log(productsCart)
                let productsIdCart = productsCart.map(prod => prod.product.toString()) //Guarda los id´s de los productos de mi carrito y genera la proipiedad .product dentro del array products
                console.log(productsIdCart)
                let productSearch = await productsModel.findOne({ id: parseInt(productId) });
                console.log(productSearch._id.toString());
                if (productsIdCart.includes(productSearch._id.toString())) {
                    console.log("hola")//prueba

                    const productPosition = productsCart.findIndex(prod => prod.product.toString() === productSearch._id.toString())
                    console.log(productPosition)//prueba
                    if (productsCart[productPosition].quantity > 1) {
                        await cartsModel.updateOne(
                            { id: cartId, "products.product": productSearch._id },
                            { $inc: { "products.$.quantity": -1 } }
                        );
                    }
                    else if (productsCart[productPosition].quantity === 1) {
                        await cartsModel.updateOne(
                            { id: parseInt(cartId) },
                            { $pull: { products: { product: productSearch._id } } }
                        );
                    }

                    return response.send(`Se ha eliminado el producto con el id=${productId} del carrito con id=${cartId}`)
                }
                else {
                    return response.send(`Oh Oh, no puedes eliminar el producto con el id=${productId} porque no existe en él :(`)
                }
            }
            return response.send({ msg: `El carrito con el id=${cartId} no existe.` })
        }
        else {
            return response.send('<h2 style="color: red">No hay carritos disponibles, por lo tanto, no podemos ejecutar esto.</h2>');
        }
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo eliminar un producto del carrito.</h2>');
    }
});


//Params para eliminar de un carrito específico, todos sus productos. Funciona con moongose :)
router.delete('/:cid', async (request, response) => {
    try {
        let cartId = request.params.cid
        let carts = await cartsModel.find();
        if (carts && carts.length > 0) {
            let idSearch = carts.find(cart => cart.id === parseInt(cartId)) //carrito que busco
            console.log(idSearch)
            if (idSearch) {
                await cartsModel.updateOne({ id: cartId }, { $set: { products: [] } });
            }
            else {
                return response.send(`Oh Oh, no puedes eliminar el carrito con el id=${cartId} porque no existe :(`)
            }
            return response.send(`Se han eliminado los productos del carrito con id=${cartId}`);
        }
        else {
            return response.send('<h2 style="color: red">No hay carritos disponibles, por lo tanto, no podemos ejecutar esto.</h2>');
        }
    } catch (error) {
        console.error("Ha surgido este error: " + error)
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo eliminar un producto del carrito.</h2>')
    }
})

//Ruta que modifica la cantidad de productos de un tipo específico en un carrito
router.put('/:cid/product/:pid', async (request, response) => {
    try {
        let cartId = request.params.cid
        let productId = request.params.pid
        let newQuantity = request.body

        const cart = await cartsModel.findOne({ id: parseInt(cartId) });
        if (!cart) {
            return response.send(`El carrito con el id=${cartId} no existe.`);
        }
        console.log(cart.products.length)
        if (cart.products.length > 0) {
            // Verificar si el producto existe
            const product = await productsModel.findOne({ id: parseInt(productId) });
            if (!product) {
                return response.send(`El producto con el id=${productId} no existe.`);
            }

            // Verificar si el producto ya está en el carrito
            const existingProductIndex = cart.products.findIndex(item => item.product.toString() === product._id.toString());
            if (existingProductIndex !== -1) {
                // Si el producto ya está en el carrito, incrementar la cantidad
                cart.products[existingProductIndex].quantity = parseInt(newQuantity);
            } else {
                return response.send(`El producto con el id=${productId} no existe en el carrito con el id=${cartId}.`);
            }

            // Actualizar el carrito en la base de datos
            await cartsModel.findOneAndUpdate({ id: parseInt(cartId) }, { products: cart.products });

            return response.send(`Se ha actualizado la cantidad de ejemplares del producto con el id=${productId} en el carrito con id=${cartId}`);
        }
        else {
            return response.send(`El carrito con el id=${cartId} esta vacío.`);
        }
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send(`<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo modificar la cantidad del prodructo con id=${product} del carrito con id=${cartId}.</h2>`);
    }
})

//Ruta que modifica el array completo de products de un carrito específico
router.put('/:cid', async (request, response) => {
    try {
        let cartId = request.params.cid
        let newProducts = request.body
        const cart = await cartsModel.findOne({ id: parseInt(cartId) });
        if (!cart) {
            return response.send(`El carrito con el id=${cartId} no existe.`);
        }
        else {
            cart.products = newProducts
        }
        // Actualizar el carrito en la base de datos
        await cartsModel.findOneAndUpdate({ id: parseInt(cartId) }, { products: cart.products });
        return response.send(`Se ha actualizado los productos del carrito con id=${cartId}`);

    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send(`<h2 style="color: red">¡Oh oh! Ha surgido un error, por lo tanto, no se pudo modificar los productos del carrito con id=${cartId}.</h2>`);
    }
})

export default router;