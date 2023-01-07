require("dotenv").config();
const express = require("express");
const app = express();
var morgan = require("morgan");
const cors = require("cors");
// 导入 Person Model
const Person = require("./models/person");

// 允许跨域获取资源的中间件
app.use(cors());
// 用于返回前端页面，每当express收到一个HTTP GET请求时，它将首先检查build目录中是否包含一个与请求地址相对应的文件。如果找到了正确的文件，express将返回它。
app.use(express.static("build"));
// 使用中间件 json 解析器
app.use(express.json());
// 3.7: Phonebook backend step7
// app.use(morgan("tiny"));
// 3.8*: Phonebook backend step8
// morgan 自定义日志格式
// morgan.token() 第一个参数是兹定于 token 的名称，第二个参数提供一个回调函数，返回日志的内容
// eslint-disable-next-line no-unused-vars
morgan.token("body", (req, res) => {
  return req.method === "POST" ? JSON.stringify(req.body) : null;
});
// app.use(morgan()) morgan 里传入 token 名称"body"（其他token是预置的）
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

// MARK: - 路由
// GET: 主页，返回 h1 标题
app.get("/", (_request, response) => {
  response.send("<h1>Phonebook App</h1>");
});

// GET: 获取所有 persons
app.get("/api/persons", (_request, response) => {
  // 查找所有 person（{}） 并响应
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

// GET: 显示收到请求的时间和处理请求时电话簿中的条目数量。
app.get("/info", (_request, response) => {
  const requestTime = new Date();
  Person.estimatedDocumentCount().then((number) => {
    response.send(
      `<p>Phonebook has info for ${number} people</p><p>${requestTime}</p>`
    );
  });
});

// GET: 查询指定 id 的 person
app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// DELETE: 删除单个电话簿条目。
app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((deletedPerson) => {
      if (deletedPerson) {
        response.status(204).end();
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// POST: 新增一个 person
app.post("/api/persons", (request, response, next) => {
  const body = request.body;
  // 检查 请求 body 中是 name、number 值是否存在
  if (!body.name || !body.number) {
    return response.status(400).json({ error: "missing name or number" });
  }

  Person.findOne({ name: body.name }).then((samePerson) => {
    // 如果存在同名的人，响应 400 错误
    if (samePerson) {
      return response.status(400).json({ error: "name must be unique" });
    }

    // 使用 body 参数新增 persom
    const person = new Person({
      name: body.name,
      number: body.number,
    });
    // 将新增的 person doc 保存到数据库
    person
      .save()
      .then((savedPerson) => {
        response.json(savedPerson);
      })
      .catch((error) => next(error));
  });
});

// PUT: 更新 person
app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;
  const person = {
    name: body.name,
    number: body.number,
  };
  Person.findByIdAndUpdate(request.params.id, person, {
    new: true, // 返回更新后的 doc
    runValidators: true, // 进行验证选项设置为 true
    context: "query", // context 上下文 设置为 query
  })
    .then((undatedPerson) => {
      response.json(undatedPerson);
    })
    .catch((error) => next(error));
});

// 这个函数是之前的练习中，用来生成 person id 的，由于现在已经使用数据库，由数据生成id，因此这个函数不再使用
// 使用 unix 时间戳 和 随机数生成id
// const generateId = () => {
//   const timestamp = Date.now();
//   return Math.floor(timestamp + Math.random() * 1000000);
// };

const unknownEndpoint = (_request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};
// 未知端点的处理程序的中间件，位置必须在所有路由之后
app.use(unknownEndpoint);

// 错误处理程序
const errorHandler = (error, _request, response, next) => {
  console.log(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }
  // 如果是验证错误
  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};
// 处理错误的中间件，位置必须在所有路由之后
app.use(errorHandler);

// 如果存在 PORT 环境变量，则使用环境变量作为 PORT，否则使用 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
