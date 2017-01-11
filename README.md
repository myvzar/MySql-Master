# MySql queries generator for node.js
Help you easy generate hard queries in function way. Use full power of mysql driver and give acces to all parts.
All variables and column names are checked and used as placeholders. It's avoid SQL Injection.

> In 2 version - All callbacks replaced by promises.

Depends:

[Node.js driver for mysql](https://www.npmjs.com/package/mysql) >= 2.12.0

**Chapters:**
- [Install](#install)
- [Init](#init)
- [Example](#example)
- [Common Information](#common-information)
- [Get generated sql string](#get-generated-sql-string)
- [Get Result](#get-results)
    + [Run](#run)
    + [Get Count](#get-count)
    + [cell](#cell)
    + [one](#one)
    + [get](#get)
- [Requests](#requests)
    * [Insert](#insert)
    * [Update](#update)
    * [Select](#select)
        + [.table()](#table-)
        + [.field()](#field--)
        + [.fields()](#fields--)
        + [.distinct()](#distinct--true)
        + [.from()](#from)
        + [.count()](#count)
        + [.page()](#page)
        + [.order()](#order---desc-)
        + [.group()](#group-)
        + [.Joins()](#joins)
        + [.condition()](#condition)
        + [.id()](#id)
        + [.conditionType()](#conditiontype--and)
    * [Delete](#delete)

Install
=======
```
npm i --save zar-mysql-master
```
Init
=======
```
var DBconf = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
};
```
and all [another options](https://www.npmjs.com/package/mysql#connection-options) for MySql Driver
```
const Database = (require('zar-mysql-master'))(DBconf);
```
So now:
```
console.log(Database) = {
    db: * - MySql Connection. = mysqlDriver.createConnection,
    connect(): function - Promise function to check connections
    request(): function - Generate object of request.
}
```
If you need to check connection manually - you can:
```
Database.connect()
    .then(function(){})  // success
    .catch(function(){}) // error
    ;
```
But you don't need check connection or connect in each request to db. All queries request - do it automatically.

Example
=======
```
var DBconf = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
};

const Database = (require('zar-mysql-master'))(DBconf);

const GetUsersForEmail = Database.request()
    .Select('Users')
    .fields(['id','name'])
    .condition('age',18,'>')
    .condition('email',null,'!')
    .group('email')
    .order('id','<')
    .page(3,40);

GetUsersForEmail.get().then((emailTo)=>{
    if(emailTo.lenght) {
        emailTo.map(user=>{sendEmailTo(user)})
    }
})
```

Sended sql will be:
```
SELECT `Users`.`id`, `Users`.`name` FROM `Users` WHERE (`Users`.`age` > 18) AND (`Users`.`email` IS NOT NULL) GROUP BY `Users`.`email` ORDER BY `Users`.`id` ASC LIMIT 80, 40
```

Common Information
==================
Each request you need get new request instance
```
const MyRequest = Database.request();
```
So now you can do your request:
```
MyRequest.Select().table('MyTable')...
```
or
```
MyRequest.Select('MyTable')...
```

> All request don't run while you not need it!!!!

Get generated sql string
========================
```
const mySqlString = MyRequest.Select('myTable').getSql();
```

Get results
==========
If you need **only requset from string**.
```
MyRequest.sql(`SQL String`[, `Array of values - for replace placeholders`]).then() - result promise
```
Run
---
```
MyRequest.Insert().run() - result promise

or

MyRequest.Update().run() - result promise
```
Get Count
---
return only count of query selection
```
MyRequest
    .Select('myTable')
    .getCount([field][,distinict])
    .then((COUNT)=>{
        console.log('Your Count:', COUNT)
    })
```
Cell
---
return only first cell of first row in query selection
```
MyRequest
    .Select('myTable')
    .field('name')
    .cell()
    .then((NAME)=>{
        console.log('Your Name:', NAME)
    })
```
One
---
Return Object - first row of query selection
```
MyRequest
    .Select('users')
    .id(21)
    .one()
    .then((USER)=>{
        console.log('USER ID = 21: ', USER)
    })
```
Get
---
Return all query selection.
> Use only for select (In other variants use - run)

```
MyRequest
    .Select('users')
    .condition('age',18,'>')
    .get()
    .then((USERS)=>{
        console.log('USERS OLDER THEN 18: ', USERS)
    })
```


Requests
========

Insert
------
```
MyRequest
    .Insert('Users')
    .Data({name:'Mike',pass:'qwerty'})
    .duplicate({name:'New Name'})
    .run()
    .then((infoAboutInsertion)=>{
        console.log(infoAboutInsertion);
    });
```

Update
------
> If need to update all - don't add any condition and use .allowAll()

> About condition - read below in [.condition()](#condition)

```
MyRequest
    .Update('Users')
    .id(21) //or .allowAll() if need to update all
    //.condition('id',21) Any Conditions what avaiable for Select
    .Data({name:'Mike',pass:'qwerty'})
    .run()
    .then((infoAboutUpdate)=>{
        console.log(infoAboutUpdate);
    });
```

Select([`table`])
-----------------
```
MyRequest
    .Select([`tableName`])
```
#### .table(`tableName` [,`tableAs`])
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
```
#### .field(`fieldName` [,`tableAs`, `fieldAs`])
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .field('age',null,'userAge')
```
#### .fields(`fieldsArray` [,`tableAs`, `fieldAs`])
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .fields(['age','name','id'])
```
#### .distinct([`status` = true])
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .distinct()
```
#### .from(`fromInt`)
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .from(10)
```
#### .count(`getCountInt`)
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .count(50)
```
#### .page(`currentPage`,`inPage`)
> Alias for .from() and .count() - Auto set data from page

```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .page(2,30)
```
#### .order(`column` [,`order` = 'DESC', `tableAs`])
> order = (`ASC` | `DESC` | `>` = 'DESC' | `<` = 'ASC')

```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .order('age','>')
```
#### .group(`column` [,`tableAs`])
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .group('name')
    .group('age')
```
#### Joins
> innerJoin (`table`,`joinParams` [,`joinTableAs`])

> leftJoin (`table`,`joinParams` [,`joinTableAs`])

> rightJoin (`table`,`joinParams` [,`joinTableAs`])


```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .fields(['id','name','age'],'myCustumName')
    .fields(['type'],'typeAs')
    .leftJoin('type','id','typeAs') // LEFT JOIN `type` AS `typeAs` USING(`id`)
    .leftJoin('type',['some condition','and some condition'],'typeAs') // LEFT JOIN `type` AS `typeAs` ON((some condition) AND (and some condition))
```
#### .condition()
> .condition(`column` [, `value`, `type`, `tableAs`])

**Your own condition**
```
MyRequest
    .Select()
    .condition('`SomeColumn` = 21 OR 1 + 1')
```
**Check NULL**
```
MyRequest
    .Select()
    .condition('someColumn',NULL)      //= `someColumn` IS NULL
    .condition('someColumn',NULL,'!')  //= `someColumn` IS NOT NULL
```
**value is Array**
```
MyRequest
    .Select()
    .condition('someColumn',[1,2,3,4])            //= `someColumn` IN(1,2,3,4)
    .condition('someColumn',[1,2,3,4],'!')        //= `someColumn` NOT IN(1,2,3,4)
    .condition('someColumn',[10,20],'BETWEEN')    //= `someColumn` BETWEEN 10 AND 20
    .condition('someColumn',[10,20[,...]],'OR')         //= `someColumn` = 10 OR `someColumn` = 20
    .condition('someColumn',[10,20[,...]],'||')         //= `someColumn` = 10 OR `someColumn` = 20
```
**value is other Sql Query (not compiled)**
```
const Administrators = Database.request()
                        .Select('types')
                        .field('id')
                        .condition('type','admin');


Database.request()
    .Select()
    .condition('someColumn',Administrators)            //= `someColumn` IN(*SQL FROM ADMINISTRATOPS*)
    .condition('someColumn',Administrators,'in')       //= `someColumn` IN(*SQL FROM ADMINISTRATOPS*)
    .condition('someColumn',Administrators,'!in')      //= `someColumn` NOT IN(*SQL FROM ADMINISTRATOPS*)
    .condition('someColumn',Administrators,'=')        //= `someColumn` = (*SQL FROM ADMINISTRATOPS*)
    .condition('someColumn',Administrators,'!=')       //= `someColumn` != (*SQL FROM ADMINISTRATOPS*)
    .condition('someColumn',Administrators,'>')        //= `someColumn` > (*SQL FROM ADMINISTRATOPS*)
    .condition('someColumn',Administrators,'<')        //= `someColumn` < (*SQL FROM ADMINISTRATOPS*)

```
**value is Primitive**
```
MyRequest
    .Select()
    .condition('someColumn',55)            //= `someColumn` = 55
    .condition('someColumn',55,'=')        //= `someColumn` = 55
    .condition('someColumn',55,'!=')       //= `someColumn` != 55
    .condition('someColumn',55,'!')        //= `someColumn` != 55

    .condition('someColumn',55,'like')     //= `someColumn` LIKE 55
    .condition('someColumn',55,'%')        //= `someColumn` LIKE &55&
    .condition('someColumn',55,'%_')       //= `someColumn` LIKE &55
    .condition('someColumn',55,'_%')       //= `someColumn` LIKE 55&

    .condition('someColumn',55, '>')       //= `someColumn` > 55
    .condition('someColumn',55, '<')       //= `someColumn` < 55
```

#### .id(`idInt`)
> Alias for .condition('id',INT)

```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .id(21)

MyRequest
    .Update('OriginalTableName')
    .id(21)
    .Data({})

MyRequest
    .Delete('OriginalTableName')
    .id(21)
```

#### .conditionType([`type` = AND])
```
MyRequest
    .Select()
    .table('OriginalTableName','myCustumName')
    .condition('name','Mike')
    .condition('name','Mi','_%')
    .conditionType('OR')
```

Delete
------
> If need to remove all - don't add any condition and use .allowAll()

> About condition - read in [.condition()](#condition)

```
MyRequest
    .Delete('Users')
    .id(21) //or .allowAll() if need to update all
    //.condition('id',21) Any Conditions what avaiable for Select
    .run()
    .then((infoAboutDelete)=>{
        console.log(infoAboutDelete);
    });
```

---
Author : Mike (myvzar) [LinkedIn](https://ua.linkedin.com/in/myvzar/en)

---