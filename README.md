# MySql-Master for node.js
node MySql query generator

Easy generate MySql queries.

##Install:

npm i --save zar-mysql-master

##Samples:
```
var DBconf = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
};
```

```
var MySql = require('zar-mysql-master').setDbInfo(DBconf);
```

###Insert:

```
var InsertData = {
    name:'Mike',
    password: 'some pass';
};

MySql
    .Insert('users')                          // table to insert
    .Data(InsertData)                         // data to insert
    .onDuplicate({name:'Mike2'})              // Duplicate fix
    .Execute(false,function(err,data){
        console.log('user inserted!');
    });
```

###Update:

```
var InsertData = {
    name:'Mike',
    password: 'some pass';
};

MySql
    .Insert('users')                          // table to update
    .Data(InsertData)                         // data to update
    .Condition('id',3)                        // update conditions
    .Execute(false,function(err,data){
        console.log('user updated!');
    });
```

###Delete:

```
MySql
    .Delete('users')                           // table to delete row
    .Condition('id',21)                        // update conditions
    .Execute(false,function(err,data){
        console.log('user updated!');
    });
```

###Select:

```
MySql
    .Select('users')
    .Fields(['id','name'])
    .Distinict()
    .Order('name','>')
    .Group('city')
    .Range(0,21)
    .Condition('id',['21','22','23'],'in')
    .GetArray(false,function(err,data){
        console.log('selected users is:', data);
    });
```

---

##Parts:
- .setDbInfo(configs) : DB connections parameter. configs must be object.
- .Table(tablename [,`psevdo`])   : Set table.

####Main Actions
- Select(tablename [,`psevdo`])   : Start select & set table (`psevdo` means use AS. (SELECT USERS AS U))
- Insert(tablename)   : Start insert & set table
- Update(tablename)   : Start update & set table
- Delete(tablename)   : Start delete & set table

####Table columns
- Fields(fields [,psevdo] ) : choose colums to get from DB (uses in Select)
- fields is array or object. array default. use object if need use AS
- Data(fields) : data for update or insert. fields must be object

####Addition
- Distinict(enable) : Select distinict. Def true
- Count([distinict] [,field] [,countName]) : Count from table by field. Default field is `id`.
- Range(from,count) : set range of results. (LIMIT 0,1)
- Order(col [, order, psevdo]) : Order can be `ASC | DESC | > | <` . > == DESC, < == ASC
- Group(col [,psevdo]) : Group by column
- onDuplicate(data) : data is object. {col:val}

####Joins
- LeftJoin(table, `params` [,psevdo]) : `params` - string (using()) or array (on( 1 and 2)) 
- RightJoin(table, `params` [,psevdo]) : `params` - string (using()) or array (on( 1 and 2)) 
- InnerJoin(table, `params` [,psevdo]) : `params` - string (using()) or array (on( 1 and 2)) 

####Conditions
- Condition(col,data [, type, psevdo]) : col - column in condition, data - value of condition

######TYPE:
if type = some string - some string will be addet to query
if type = NULL - in query will be `col` IS NULL

if data is string
type can be : ( `=` | `!` or `!=` | `like` or `&` | `!in` |)

if data is array
type can be : ( `in` | `!in` or `!` | `or` | `between` )

##SQL:
- getSql() : get rendered sql query
- Execute(closeconection, callback) : callback is function(err,data)

##GET DATA:
- GetArray(closeConnection,callback) - get all of data
- GetOne(closeConnection,callback) - get one row of data 
- GetCell(closeConnection,callback) - get one cell of data.

callback = function(err,data){}