const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        // unique: [true, 'name should be uniq'],
        trim: true, //убирает пробелы спереди и сзади
        maxlength: [40, 'a user name too long'],
        minlength: [10, 'a user name too short'],
        // validate: [validator.isAlpha, `tour name must contain only charachters`] внешний валидатор
      },
      email: {
          type: String,
          required: [true, 'please enter a correct email'],
          unique:[true, 'email should be uniq'],
          trim: true,
          lowercase: true,
          validate: [validator.isEmail, 'please enter correct email']
      },
      photo: String,
      password: {
          type: String,
          required: [true, 'please enter correct password'],
          minlength: 8,
        //   validate: [validator.isStrongPassword, 'please enter stronger password']
        select: false
      },
      passwordConfirm: {
          type: String,
          require: [true, 'please confirm password'],
          validate: {
              //this only works on SAVE or CREATE!!!
              validator: function(el) {
                  return el === this.password
              },
              message: 'passwords are not the same'
          
          },
      },
    passwordChangedAt: Date
},
{
    toJSON: {virtuals:true},
    toObject: {virtuals:true},

  }
)

userSchema.pre('save', async function(next){
   // only run if password was modified
    if (!this.isModified('password')) return next()
// хэшим пароль
this.password = await bcrypt.hash(this.password, 12)
//надо убрать подтверждение чтобы оно не прошло в базу данных.
this.passwordConfirm = undefined
next()

})

//instance method доступен для всех документов в коллекции

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTtimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000, 10)
    return JWTtimestamp < changedTimeStamp
    }
    
    return false 
}


const User = mongoose.model('User', userSchema);

module.exports = User