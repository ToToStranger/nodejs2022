const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text')

// new Email(user, url).sendWelcome() //когда будет использовать класс мы будем передавать в него пользователя и url
module.exports = class Email {
  constructor(user, url){ //конструктор будет выполнятся когда через этот класс будет создаваться новый объект
    this.to = user.email;
    this.firstName = user.name.split(' ')[0]
    this.url = url
    this.from = `stepan Kiss <${process.env.EMAIL_FROM}>` 
  }

newTransport() {
  if(process.env.NODE_ENV === 'production'){
    //sendgrid
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
      }
    })
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
})
}
async send(template, subject) {//
//1) render HTML based on a pug template

//создаем html из файла и отправляем
const html = pug.renderFile(`${__dirname}/../views.emails/${template}.pug`, {
  firstName: this.firstName,
  url: this.url,
  subject
})

//2) Define emai options
const mailOptions = {
  from: this.from,
  to: this.to,
  subject,
  html,
  text: htmlToText.fromString(html),
};
//3)create a transport and send email

await this.newTransport().sendMail(mailOptions);
}
async sendWelcome(){
await  this.send('welcome', 'Welcome to the Natours Family!')
}
async sendPasswordReset(){
  await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)')
}

}




const sendEmail = async (options) => {
  // //1) create a transporter instance
  // const transporter = nodemailer.createTransport({
  //   host: process.env.EMAIL_HOST,
  //   port: process.env.EMAIL_PORT,
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD,
  //   },

    //Activate in gmail 'less secure app' option
  
  //2) define the email options

  //3) send the email
  // await transporter.sendMail(mailOptions);
};


