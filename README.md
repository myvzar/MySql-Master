# MySql-Master
node MySql query generator

Easy generate MySql queries.

Select:

MySql.Select('user_table','user').Fields(['id','name']).Fields({password:'pass_hash'}).Condition({login:'userlogin'}).GetOne(true,function(err,data){
    console.log(data);
});