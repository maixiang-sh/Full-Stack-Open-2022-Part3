// 创建 person 在 mongoose 中的数据模型，大致分为 5 个步骤
// 1. 导入模块（dotenv 用于读取环境变量、mongoose 用于和 monggoDB 数据库交互）
// 2. 使用 monggoDB url 连接到数据库，并处理异常，记录日志
// 3. 定义 mongoose 的数据结构（Schema），设置 Schema （是否需要剔除字段，转换类型）
// 4. 使用 Schema 创建 Model
// 5. 导出 Model 作为模块

// 导入 dotenv 模块，用于读取 .env 中的环境变量
require("dotenv").config();
// 导入 mongoose 模块
const mongoose = require("mongoose");

// mongoDB 数据库的 url
const url = process.env.MONGODB_URI;

console.log("connecting to ", url);

// 连接 MangoDB数据库
mongoose
  .connect(url)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MangoDB: ", error.mongoose);
  });

// 定义数据结构
/* 给 personSchema 增加验证器：
    1. name 长度至少为 3
    2. number 长度为 8 位或以上，区号长度为2-3，必须为数字
    validate 选项需要提供一个对象, 对象有两个属性 validator、message
    - validator(value) 接受被验证的属性值，返回 undefined 或 真值，表示验证成功，返回 假值（不含 undefined）则验证失败，抛出错误，错误名称 "ValidationError";
    - message 是一个字符串，或者返回字符串的函数，表示错误信息。
        如果是函数，这个函数会接收一个被验证的属性值的对象，可以使用 (props) => `${props.value}` 或者 ({value}) => `${value}` 读取这个值
    {
        validator: function
        message: function 或 String
    }
*/
const numberValidator = (value) => {
  const reg = /^[0-9]{2}-[0-9]{6,}$|^[0-9]{3}-[0-9]{5,}$/;
  return reg.test(value);
};
const personSchema = mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true,
  },
  number: {
    type: String,
    validate: {
      validator: numberValidator,
      message: ({ value }) => `${value} is an invalid phone number`,
    },
    required: true,
  },
});
// 由于 mongoDB 上储存的数据有一些不需要的字段，另外 _id 属性是一个 object，所以这里需要进行转换（类似于编码），示例数据在下方：
// 将数据编码为 JSON
personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});
// mongoDB 上储存的数据实例，这里的 _id 是一个 object，需要转换为 string，再响应
/* {
	"_id": {
		"$oid": "63b54e88c1c763dfd5aaf757"
	},
	"name": "xiao2",
	"number": "123456",
	"__v": {
		"$numberInt": "0"
	}
}*/

// 使用 Schema 创建 Model，并将 Model 导出
module.exports = mongoose.model("Person", personSchema);
