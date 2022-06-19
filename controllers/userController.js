const User = require('./../models/userModel');
const multer = require('multer'); //используется для заливки файлов
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.diskStorage({
  detination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    //user-75764321543sd4-3312325.jpeg
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  //filter нужен для того чтобы определять тип файла и если это не картинка то кидать ошибку
  // можно и CSV
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image file', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  //  1) create eror if user POst password data is not
  if (req.body.password || passwordConfirm) {
    return next(new AppError('This route is not for password updates', 400)); // 400 bad request
  }
  //надо фильтровать то что мы отправляем в базу, чтобы не отправлять роли или токены
  // 2) filtered ненужные поля
  const filteredBody = filterObject(req.body, 'name', 'email'); //тут вставляем то что хотим оставить.
  //2) Update user docs
  const updatedUser = User.findByIdAndUpdate(req.user.id, filteredBody, {
    //используем find and update потому что данные не страшные
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    //204 это удалено успешно
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do not update password like this!
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User);
