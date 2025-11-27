const socket = io();

const username = prompt('Enter username', '');
const name = document.querySelector('#name');
name.innerText = username;

const form = document.querySelector('#form');
const input = document.querySelector('#input');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit('send_chat', input.value, username);
        input.value = '';
    }
});

// -> socket.io events
socket.on('broadcast_chat', (msg, username) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="name">${username}</span><span class="message">${msg}</span>`
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})
