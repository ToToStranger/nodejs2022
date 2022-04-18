exports.APIFeatures = (query, queryString) => {
  console.log(`lets do it!`);
  filter = () => {
    console.log(`filtering!`);
    const queryObj = { ...queryString };

    const excludedFields = [`page`, 'sort', 'limit', 'fields'];
    //удаляем лишние поля
    excludedFields.forEach((el) => {
      delete queryObj[el];
    });
    //1b) advanced filtering
    //{difficulty: 'easy', duration: {$gte:5}}
    //будем менять gte,gt,lte,lt с добавлением $

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //\b - это значит что ищем ТОЧНОе совпадене. /g -множество раз можем менять.

    cquery = query.find(JSON.parse(queryStr));
    return cquery; //вернет объект целиком
  };

  sort = () => {
    console.log(`NO SORTING!`);
    if (queryString.sort) {
      const sortBy = queryString.sort.split(',').join(' ');
      cquery = query.sort(sortBy);
    } else {
      cquery = query.sort('-createdAt'); //если не указали сортировку, сортируем автоматом по времени создания, сначала новые
    }
    return cquery;
  };

  limitFields = () => {
    if (queryString.fields) {
      const fields = queryString.fields.split(',').join(' ');
      cquery = query.select(fields);
    } else {
      cquery = query.select('-__v'); //если ставим в запросе " - " это значит исключаем это из данных
    }
    return cquery;
  };
  paginate = () => {
    const page = queryString.page * 1 || 1; // надо обязательно сделать из string
    const limit = queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    // page=2&limit=10
    cquery = query.skip(skip).limit(limit);

    return cquery;
  };
};

