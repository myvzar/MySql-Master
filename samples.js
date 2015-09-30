var DBconf = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
};

var MySql = require('MySqlMaster').setDbInfo(DBconf);

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