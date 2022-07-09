import '@babel/polyfill';
import { login, logout } from './login';
import { updateData } from './updateSettings';
import { bookTour } from './stripe';


const mapBox = document.getElementById('map'); //такогоэлемента у нас нет! я его не делал потому что он платный
const loginFrom = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const bookBtn =  document.getElementById('book-tour')

console.log('running js');

if (loginFrom) {
  console.log('running js2');

  loginFrom.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log(`login clicked`, email, password);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData()
    form.append('name', document.getElementById('name').value)
    form.append('email', document.getElementById('email').value)
    form.append('photo', document.getElementById('photo').files[0])
    updateData(form, 'data');
  });

if(bookBtn) bookBtn.addEventListener('clock', e=> {
  e.target.textContent = 'Processing...'
  const {tourId} = e.target.dataset
  bookTour(tourId)
})
