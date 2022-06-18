import { login, logout } from './login';

const mapBox = document.getElementById('map'); //такогоэлемента у нас нет! я его не делал потому что он платный
const loginFrom = document.querySelector('form');
const logOutBtn = document.querySelector('.nav__el--logout');

if (loginFrom) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);
