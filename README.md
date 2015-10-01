# MySql-Master for node.js
node MySql query generator

Easy generate MySql queries.

##Install:

npm i --save zar-mysqlmaster

##Quick Samples:

var DBconf = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
};

```
var MySql = require('zar-mysqlmaster').setDbInfo(DBconf);

MySql.Select('users').GetArray(false,function(err,data){
    console.log(data);
});

MySql
    .Select('users','u')
    .Fields({'name':'me'},'u')
    .Fields({'uid1':'my_friend_id'},'f')
    .Condition('id',1)
    .LeftJoin('friends',['u.id = f.uid1'],'f')
    .GetArray(true,function(err,data){
        console.log(data);
    });
```

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

##Samples:

###Insert:
