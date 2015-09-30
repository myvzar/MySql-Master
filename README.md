# MySql-Master for node.js
node MySql query generator

Easy generate MySql queries.

Install:

npm i --save zar-mysqlmaster

Samples:

var DBconf = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
};

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
