import express from 'express';
import { productsModel } from '../models/products.model.js';
import { cartsModel } from '../models/carts.model.js';
const router = express.Router();

//Ruta que muestra los productos no en tiempo real con pages y podemos poner limit
router.get("/home", async (request, response) => {
    try {
        let page = parseInt(request.query.page) || 1;
        let limit = parseInt(request.query.limit);

        // Si limit no es un número válido o está vacío, asignarle el valor predeterminado de 10
        if (!limit || isNaN(limit)) {
            limit = 10;
        }

        if (!request.query.hasOwnProperty('limit')) {
            // Si limit no está presente en la consulta, utilizar la paginación
            let result = await productsModel.paginate({}, { page, limit: 5, lean: true });
            // Actualizar los enlaces de paginación
            result.prevLink = result.hasPrevPage ? `http://localhost:9090/handlebars/home?page=${result.prevPage}` : '';
            result.nextLink = result.hasNextPage ? `http://localhost:9090/handlebars/home?page=${result.nextPage}` : '';
            result.isValid = !(page <= 1 || page > result.totalPages);
            result.shouldShowPagination = result.page <= result.totalPages;

            //Mensaje que se manda para saber detalles de la page
            let responseObject = {
                status: "success",
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.hasPrevPage ? `http://localhost:9090/handlebars/home?page=${result.prevPage}` : null,
                nextLink: result.hasNextPage ? `http://localhost:9090/handlebars/home?page=${result.nextPage}` : null
            };
            console.log(responseObject)
            
            return response.render('home', {
                style: "viewsHandlebars.css",
                result
            });
        } else {
            // Si se proporciona un límite en la consulta, no se utiliza la paginación
            let products = await productsModel.find().limit(limit).lean();
            return response.render('home', {
                style: "viewsHandlebars.css",
                result: {
                    docs: products,
                    isValid: true // Se establece como válido ya que no hay paginación
                }
            });
        }

    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error al obtener los productos.</h2>');
    }
})

//Nos ordena los objetos ascendentemente seegún su precio
router.get("/home/sort", async (request, response) => {
    try {
        let page = parseInt(request.query.page) || 1;
        let result = await productsModel.paginate({}, { page, limit: 5, sort: { price: 1 }, lean: true });

        result.prevLink = result.hasPrevPage ? `http://localhost:9090/handlebars/home/sort?page=${result.prevPage}` : '';
        result.nextLink = result.hasNextPage ? `http://localhost:9090/handlebars/home/sort?page=${result.nextPage}` : '';
        result.shouldShowPagination = result.page <= result.totalPages;
        result.order = "Ordenamos los productos de menor a mayor precio ... "

        //Mensaje que se manda para saber detalles de la page
        let responseObject = {
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `http://localhost:9090/handlebars/home/sort?page=${result.prevPage}` : null,
            nextLink: result.hasNextPage ? `http://localhost:9090/handlebars/home/sort?page=${result.nextPage}` : null
        };
        console.log(responseObject)

        response.render('home', {
            style: "viewsHandlebars.css",
            result
        });
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error al ordenar los productos.</h2>');
    }
})

//Ruta que filtra los productos por categoria
router.get("/home/search", async (request, response) => {
    try {
        let page = parseInt(request.query.page) || 1;
        let category = (request.query.category).toLowerCase(); 
        let query = category ? { category: category } : {}; // Si se proporciona una categoría, la usamos como filtro

        let result = await productsModel.paginate(query, { page, limit: 5, lean: true });

        // Actualizar los enlaces de paginación
        result.prevLink = result.hasPrevPage ? `http://localhost:9090/handlebars/home/search?category=${category}&page=${result.prevPage}` : '';
        result.nextLink = result.hasNextPage ? `http://localhost:9090/handlebars/home/search?category=${category}&page=${result.nextPage}` : '';
        result.shouldShowPagination = result.page <= result.totalPages;
        result.order = `Filtramos por la categoria: ${category.toUpperCase()}`

        //Mensaje que se manda para saber detalles de la page
        let responseObject = {
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `http://localhost:9090/handlebars/home/search?category=${category}&page=${result.prevPage}` : null,
            nextLink: result.hasNextPage ? `http://localhost:9090/handlebars/home/search?category=${category}&page=${result.nextPage}` : null
        };
        console.log(responseObject)

        response.render('home', {
            style: "viewsHandlebars.css",
            result
        });
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error al ordenar los productos.</h2>');
    }
})

//Ruta que muestra los productos en tiempo real
router.get("/realTimeProducts", async (request, response) => {
    try {
        let products = await productsModel.find().lean();
        console.log(products)
        // Renderizar la plantilla con los datos actualizados
        response.render('realTimeProducts', {
            style: "viewsHandlebars.css",
            products
        });
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error al obtener los productos.</h2>');
    }
})

//Ruta que nos muestra el chat
router.get("/messages", (request, response) => {
    response.render('chat', {
        style: "viewsHandlebars.css"
    })
})

//Ruta que nos muestra los productos con paginación y botón para agregar al carrito
router.get("/products", async (request, response) => {
    try {
        let page = parseInt(request.query.page) || 1;

        let result = await productsModel.paginate({}, { page, limit: 5, lean: true });

        // Actualizar los enlaces de paginación
        result.prevLink = result.hasPrevPage ? `http://localhost:9090/handlebars/products?page=${result.prevPage}` : '';
        result.nextLink = result.hasNextPage ? `http://localhost:9090/handlebars/products?page=${result.nextPage}` : '';
        result.isValid = !(page <= 1 || page > result.totalPages);

        //Mensaje que se manda para saber detalles de la page
        let responseObject = {
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `http://localhost:9090/handlebars/products?page=${result.prevPage}` : null,
            nextLink: result.hasNextPage ? `http://localhost:9090/handlebars/products?page=${result.nextPage}` : null
        };
        console.log(responseObject)

        return response.render('productsWithButton', {
            style: "viewsHandlebars.css",
            result
        });

    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error al mostrar los productos.</h2>');
    }
})

//Ruta que nos muestra los productos de un carrito
router.get('/carts/:cid', async (request, response) => {
    try {
        let cartId = request.params.cid
        let cart = await cartsModel.findOne({ id: parseInt(cartId) }).populate("products.product")
        if (cart) {
            let productsCart = cart.products.map(product => product.product.toObject()); // Convertimos los documentos de los productos a objetos simples de JavaScript

            productsCart.id = parseInt(cartId)
            if (productsCart.length > 0) {
                response.render('productsCart', {
                    style: "viewsHandlebars.css",
                    productsCart
                });
            } else {
                productsCart.none = `¡Oh oh! El carrito con id=${cartId} está vacío.`
                return response.render('productsCart', {
                    style: "viewsHandlebars.css",
                    productsCart
                });
            }
        } else {
            return response.send(`El carrito con id=${cartId} no existe :(`)
        }
    } catch (error) {
        console.error("Ha surgido este error: " + error);
        response.status(500).send('<h2 style="color: red">¡Oh oh! Ha surgido un error y no se pueden mostrar los productos.</h2>');
    }
})

export default router;