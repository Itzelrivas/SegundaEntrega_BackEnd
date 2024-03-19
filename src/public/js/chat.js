const socket = io();
let user
const chat = document.getElementById('messageText')

Swal.fire({
    icon: "info",
    title: "Ingresa tus datos, por favor...",
    input: 'text',
    text: 'Introduce tu correo electrónico:',
    inputValidator: (value) => {
        if(!value){
            return "Debes escribir tu correo para poder participar en el chat :)"
        } else {
            socket.emit('userConnected', {user: value})
        }
    },
    allowOutsideClick: false
}).then(result => {
    user = result.value
    const myEmail = document.getElementById('myEmail')
    myEmail.innerHTML = user
})

chat.addEventListener('keyup', event => {
    if(event.key === 'Enter'){
        if(chat.value.trim().length > 0){
            socket.emit('message', {user: user, message: chat.value})
            chat.value = ''
        } else {
            Swal.fire({
                icon: "warning",
                title: "ALTOOOOO",
                text: "Tu mensaje esta vacío, y de esa forma no es posible enviarlo."
            })
        }
    }
})

// Escuchamos a todos los usuarios que estan conectados
socket.on('messageLogs', data => {
    const messageLogs = document.getElementById('chatSpace')
    let logs = '';
    data.forEach(log => {
        logs += `<b>${log.user}</b> dice: ${log.message}<br/>`
    });
    chatSpace.innerHTML = logs
})

// cerramos el chat
const closeChatBox = document.getElementById('closeChat');
closeChatBox.addEventListener('click', evt => {
    alert("Gracias por usar este chat, Adios!!")
    socket.emit('closeChat', { close: "close" })
    chatSpace.innerHTML = ''
})