/**
 * Created by Mike on 16.09.2015.
 */

var MySql = require('index');

MySql.Select('user_table','user').Fields(['id','name']).Fields({password:'pass_hash'}).Condition({login:'userlogin'}).GetOne(true,function(err,data){
    console.log(data);
});