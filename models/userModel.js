const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
      // unique: [true, 'name should be uniq'],
      trim: true, //убирает пробелы спереди и сзади
      maxlength: [40, 'a user name too long'],
      minlength: [3, 'a user name too short'],
      // validate: [validator.isAlpha, `tour name must contain only charachters`] внешний валидатор
    },
    email: {
      type: String,
      required: [true, 'please enter a correct email'],
      unique: [true, 'email should be uniq'],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'please enter correct email'],
    },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'please enter correct password'],
      minlength: 8,
      //   validate: [validator.isStrongPassword, 'please enter stronger password']
      select: false,
    },
    passwordConfirm: {
      type: String,
      require: [true, 'please confirm password'],
      validate: {
        //this only works on SAVE or CREATE!!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function (next) {
  // only run if password was modified
  if (!this.isModified('password')) return next();
  // хэшим пароль
  this.password = await bcrypt.hash(this.password, 12);
  //надо убрать подтверждение чтобы оно не прошло в базу данных.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //выходим если пароль изменили и если это новый документ
  this.passwordChangedAt = Date.now() - 1000; //чтобы не получилось так, что токен создали раньше даты в записи, отнимаем от записи 1 секунду
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } }); //тут надо именно что НЕ false. потому что тогда все элементы без значения active тоже будут показываться

  next();
});

//instance method доступен для всех документов в коллекции

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTtimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
