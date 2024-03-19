const socket = io();

// Escuchar el evento de actualización de productos
socket.on('updateProducts', (products) => {
    const productList = document.getElementById('productContainer');
    productList.innerHTML = ''; // Creamos nuetro "contenedor" de productos 

    products.forEach((product) => {
        const productDiv = document.createElement('div');
        //Agregamos nuestro contenido por cada producto
        productDiv.classList.add('containerRealTime');
        productDiv.innerHTML = `
            <h2 style="color: beige">${product.title}</h2>
            <h3>Descripción: ${product.description}</h3>
            <h3>Código: ${product.code}</h3>
            <h3>Categoría: ${product.category}</h3>
            <h3>Piezas disponibles: ${product.stock}</h3>
            <h3>Precio: $${product.price}</h3>
        `;

        //Actualizo las imagenes 
        product.thumbnail.forEach((thumbnail) => {
            const imgElement = document.createElement('img');
            imgElement.style.width = '20%';
            imgElement.src = `/img/${thumbnail}`;
            imgElement.alt = product.title;
            productDiv.appendChild(imgElement);
        });

        productList.appendChild(productDiv); // Los agregamos en orden :)
    });
});

