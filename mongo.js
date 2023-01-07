const mongoose = require("mongoose");

if (process.argv.length !== 3 && process.argv.length !== 5) {
  console.log("Invalid input. Please enter the following command:");
  console.log(
    " 1. Add a new phone number, enter: node mongo.js <password> <name> <number>"
  );
  console.log(" 2. View all phone number, enter: node mongo.js <password>");
  process.exit(1);
}

const password = process.argv[2];

const url = `mongodb+srv://maixiang:${password}@cluster0.nsxve97.mongodb.net/phoneBookApp?retryWrites=true&w=majority`;

mongoose.connect(url);

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

// mongoose 数据模型
const Person = mongoose.model("Person", personSchema);

// 3.12: Command-line database
// 将新条目添加到数据库中
const addNewPerson = (name, number) => {
  const person = new Person({
    name: name,
    number: number,
  });

  person.save().then((savedPerson) => {
    console.log(`added ${savedPerson.name} ${savedPerson.number} to phonebook`);
    mongoose.connection.close();
  });
};

// 3.12: Command-line database
// 显示数据库中所有的条目
const viewAll = () => {
  Person.find({}).then((result) => {
    result.forEach((person) => {
      console.log(`${person.name} ${person.number}`);
    });
    mongoose.connection.close();
    process.exit(0);
  });
};

// 根据命令行参数判断要执行的动作
if (process.argv.length === 3) {
  // 查看数据库所有条目
  viewAll();
}

if (process.argv.length === 5) {
  // 新增条目掉数据库
  const name = process.argv[3];
  const number = process.argv[4];
  addNewPerson(name, number);
}
