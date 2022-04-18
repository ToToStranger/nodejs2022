class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };

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

    this.query = this.query.find(JSON.parse(queryStr));
    return this; //вернет объект целиком
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); //если не указали сортировку, сортируем автоматом по времени создания, сначала новые
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //если ставим в запросе " - " это значит исключаем это из данных
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1; // надо обязательно сделать из string
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    // page=2&limit=10
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
