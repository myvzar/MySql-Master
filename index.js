const mysqlDriver = require('mysql');

const _SELECT = Symbol();
const _INSERT = Symbol();
const _UPDATE = Symbol();
const _DELETE = Symbol();

class Database {

  constructor(db){
    this.query = {};
    this.db = db;
  }

  clear(){
    this.query = {};
    this.__isset('fields',[]);
  }

  table(table,_ps = null){
    let action = this.__q('action');
    this.clear();
    this.__q('action',action);
    this.__q('table',table);
    this.__q('psevdo',_ps);
    return this;
  }

  /*----------- ACTIONS -----------*/

  __action(action,table=null){
    if(table) this.table(table);
    this.__q('action',action);
    return this;
  }

  Select(table=null) {
    return this.__action(_SELECT,table);
  }

  Insert(table=null) {
    return this.__action(_INSERT,table);
  }

  Update(table=null) {
    return this.__action(_UPDATE,table);
  }

  Delete(table=null) {
    return this.__action(_DELETE,table);
  }

  /*----------- PARTS -----------*/

  field(name,_ps=null,as=null){
    this.query.fields.push({
      name:name,
      ps:_ps,
      as:as
    });
    return this;
  }

  fields(fields,_ps=null){
    if(Array.isArray(fields)) {
      fields.forEach((field)=>this.field(field,_ps));
    }
    if(this._isObject(fields)) {
      for(let i in fields) {
        if(fields.hasOwnProperty(i)) {
          this.field(i,_ps,fields[i])
        }
      }
    }
    return this;
  }

  data(values){
    this.__q('data',values);
    return this;
  }

  distinct(status=true){
    this.__q('distinct',status);
    return this;
  }

  allowAll(status=true){
    this.__q('allowAll',status);
    return this;
  }

  from(int){
    this.__q('from',parseInt(int));
    return this;
  }

  page(page,inPage){
    if(page<1) { page = 1 }
    return this.count(inPage).from((page-1)*inPage);
  }

  count(int){
    this.__q('count',parseInt(int));
    return this;
  }

  order(column,order='>',_ps=null){
    this.__isset('order',[]);
    this.query.order.push({
      column : column,
      order : (o=>{
        if(o == '>') { o = 'desc'; }
        if(o == '<') { o = 'asc'; }
        return o.toUpperCase();
      })(order),
      ps:_ps
    });
    return this;
  }

  group(column,_ps=null){
    this.__isset('group',[]);
    this.query.group.push({
      column : column,
      ps : _ps
    });
    return this;
  }

  innerJoin(table,params,_ps=null){
    return this._join('INNER',table,params,_ps)
  }

  leftJoin(table,params,_ps=null){
    return this._join('LEFT',table,params,_ps)
  }

  rightJoin(table,params,_ps=null){
    return this._join('RIGHT',table,params,_ps)
  }

  condition(column,value,type=null,_ps=null){
    this.__isset('condition',[]);
    let subType = null;
    if(value && !!value.getSql) {
      value = value.getSql();
      subType = type;
      type = 'sql';
    }
    this.query.condition.push({
      column : column,
      value : value,
      sub : subType,
      type : type ? type.toLowerCase() : null,
      ps : _ps,
    });
    return this;
  }

  id(int,_ps=null){
    return this.condition('id',parseInt(int),null,_ps)
  }

  conditionType(type='AND'){
    this.__q('conditionType',type);
    return this;
  }

  duplicate(rewrite){
    this.__q('duplicate',rewrite);
    return this;
  }

  /*----------- SYSTEM -----------*/

  __isset(name,defValue){
    if(!this.__q(name)) {
      this.__q(name,defValue)
    }
  }

  _isObject(val){
    return (typeof val === "object" && !Array.isArray(val) && val !== null);
  }

  _join(type,table,params,_ps=null){
    this.__isset('join',[]);
    this.query.join.push({
      type : type,
      table : table,
      params : params,
      ps : _ps,
    });
    return this;
  }

  __q(name,value=null){
    if(!name) return null;
    return !value ? this.query[name]||null : this.query[name] = value;
  }

  /*----------- SQL -----------*/

  _column(column,_ps){
    const placeholder = !_ps ? (()=>
        !this.query.psevdo ?
          this.query.table :
          this.query.psevdo)()
      : _ps;
    return this.db.escapeId(`${placeholder?placeholder+'.':''}${column}`);
  }

  _conditionType(type,def){
    return (type||def).toLowerCase();
  }

  ___sql_condition(){
    if(Array.isArray(this.query.condition) && this.query.condition.length) {
      return this.query.condition.map(condition=>{
        let condSql  = null;
        let condData = null;
        if(condition.column) {
          if(!condition.value && !condition.type && condition.value!==null) {
            condSql = condition.column;
          } else {
            const condColumn = this._column(condition.column,condition.ps);
            if(condition.value === null) {
              condSql = `${condColumn} IS${!condition.type || condition.type == 'is' ? '' : ' NOT'} NULL`;
            } else {
              if(Array.isArray(condition.value)) {
                const type = this._conditionType(condition.type,'in');
                switch (type) {
                  case 'or':
                  case '||':
                    condSql = condition.value
                      .map(c=>mysqlDriver.format(`${condColumn} = ?`,c))
                      .join(' OR ');
                    break;
                  case 'between':
                  case '><':
                    condSql = `${condColumn} BETWEEN ? AND ?`;
                    condData = [condition.value[0]||0,condition.value[1]||0];
                    break;
                  case 'in':
                  case '!in':
                  case '!':
                  default:
                    condSql = `${condColumn} ${type!='in'?'NOT ':''}IN(?)`;
                    condData = [condition.value];
                    break;
                }
              } else {
                const type = this._conditionType(condition.type,'=');
                switch (type) {
                  case '=':
                  case '!':
                  case '!=':
                    condSql = `${condColumn} ${type!='='?'!':''}= ?`;
                    condData = condition.value;
                    break;
                  case 'like':
                  case '%':
                  case '%_':
                  case '_%':
                    condSql = `${condColumn} LIKE ?`;
                    condData = ((t,v)=>{
                      switch(t) {
                        case '%' : return `%${v}%`; break;
                        case '%_': return `%${v}`; break;
                        case '_%': return `${v}%`; break;
                        default: return v; break;
                      }
                    })(type,condition.value);
                    break;
                  case '<':
                  case '>':
                    condSql = `${condColumn} ${type} ?`;
                    condData = condition.value;
                    break;
                  case 'sql':
                    condSql = `${condColumn} `;
                    const subType = this._conditionType(condition.sub,'in');
                    switch (subType){
                      case 'in': condSql+=`IN(${condition.value})`; break;
                      case '!in':
                        condSql+=`NOT IN(${condition.value})`;
                        break;
                      case '=': condSql+=`= (${condition.value})`; break;
                      case '!=':
                        condSql+=`!= (${condition.value})`;
                        break;
                      case '>':
                      case '<':
                        condSql+=`${subType} (${condition.value})`;
                        break;
                    }
                    break;
                }
              }
            }
          }
        } else { return null; }
        return mysqlDriver.format(`(${condSql})`,condData);
      }).filter(i=>i).join(` ${this.__q('conditionType')||'AND'} `);
    }
    return null
  }

  __sql_select(){
    let SqlStr = `SELECT `;
    let SqlValues = null;

    if(this.__q('distinct')) { SqlStr += 'DISTINCT ' }

    if(this.query.isCount) {
      SqlStr += `COUNT(${this.query.isCount.distinict?'DISTINCT ':''}${this.query.isCount.field}) AS COUNT`;
    } else {
      if(this.query.fields && Array.isArray(this.query.fields) && this.query.fields.length) {
        SqlStr += this.query.fields.map(field=>{
          return `${this._column(field.name,field.ps)}`+(field.as?` as ${this.db.escapeId(field.as)}`:'');
        }).join(', ')
      } else { SqlStr += '*'; }
    }

    SqlStr += ` FROM ${this.db.escapeId(this.__q('table'))}`;

    const psevdo = this.__q('psevdo');

    if(psevdo) { SqlStr += ` AS ${this.db.escapeId(psevdo)}`; }

    if(this.query.join && Array.isArray(this.query.join) && this.query.join.length) {
      SqlStr += ' '+this.query.join.map((join)=>{
        let joinStr = `${join.type} JOIN ${this.db.escapeId(join.table)}`;
        if(join.ps) { joinStr+=` AS ${this.db.escapeId(join.ps)}`; }
        if(Array.isArray(join.params)) {
          joinStr+=` ON(${join.params.join(' AND ')})`;
        } else {
          joinStr+=` USING(${this.db.escapeId(join.params)})`;
        }
        return mysqlDriver.format(joinStr);
        }).join(' ')
    }

    const Condition = this.___sql_condition();

    if(Condition) {
      SqlStr += ' WHERE ' + Condition;
    }

    if(this.query.group && Array.isArray(this.query.group) && this.query.group.length) {
      SqlStr+=' GROUP BY '+this.query.group.map(group=>this._column(group.column,group.ps)).join(', ')
    }

    if(this.query.order && Array.isArray(this.query.order) && this.query.order.length) {
      SqlStr+=' ORDER BY '+this.query.order.map(order=>`${this._column(order.column,order.ps)} ${order.order}`).join(', ')
    }

    if(!this.query.isCount && (this.query.from||this.query.count)) {
      SqlStr+=' LIMIT ' + (one=>{
        return one ?
          mysqlDriver.format('?',this.query.from||this.query.count) :
          mysqlDriver.format('?, ?',[this.query.from,this.query.count]);
        })(!this.query.from != !this.query.count);
    }

    this.query.isCount = null;
    return {
      sql: SqlStr,
      values:SqlValues
    };
  }

  __sql_insert(){
    let SqlStr = `INSERT INTO ${this.db.escapeId(this.__q('table'))} SET ?`;
    let SqlValues = this.__q('data');
    const duplicate = this.__q('duplicate');
    if(duplicate) {
      SqlStr += mysqlDriver.format(' ON DUPLICATE KEY UPDATE ?', duplicate);
    }
    return {
      sql: SqlStr,
      values:SqlValues
    };
  }

  __sql_update(){
    let SqlStr = `UPDATE ${this.db.escapeId(this.__q('table'))} SET ?`;
    let SqlValues = this.__q('data');
    let Condition = this.___sql_condition();
    if(Condition || this.__q('allowAll')) {
      if(Condition) { SqlStr += ` WHERE ${Condition}`; }
      return {
        sql: SqlStr,
        values:SqlValues
      };
    } else {
      throw new Error('Update needs condition to work!');
    }
  }

  __sql_delete(){
    let SqlStr = `DELETE FROM ${this.db.escapeId(this.__q('table'))}`;
    let SqlValues = null;
    let Condition = this.___sql_condition();
    if(Condition || this.__q('allowAll')) {
      if(Condition) { SqlStr += ` WHERE ${Condition}`; }
      return {
        sql: SqlStr,
        values:SqlValues
      };
    } else {
      throw new Error('Delete needs condition to work!');
    }
  }

  __sql(){
    switch(this.__q('action')){
      case _SELECT: return this.__sql_select(); break;
      case _INSERT: return this.__sql_insert(); break;
      case _UPDATE: return this.__sql_update(); break;
      case _DELETE: return this.__sql_delete(); break;
    }
    return null;
  }

  /*----------- RESULTS -----------*/

  sql(sql,values=null){
    return new Promise((resolve,reject)=>{
      this.db.query(
        {
          sql: sql,
          values:values
        },
        (error, results, fields) => error ?
          reject(error) :
          resolve(results)
      )
    })
  }

  run(){
    return new Promise((resolve,reject)=>{
      const query = this.__sql();
      if(!query) { reject('Bad Action') }
      else {
        query.sql = `${query.sql};`;
        this.sql(query.sql,query.values)
          .then(resolve,reject);
      }
    })
  }

  getCount(field='id',distinict=false){
    this.__q('isCount',{
      field : field,
      distinict : distinict,
    });
    return this.cell();
  }

  getSql(){
    const query = this.__sql();
    if(query && query.sql) {
      return mysqlDriver.format(query.sql,query.values||null);
    }
    return null;
  }

  cell(){
    return new Promise((resolve,reject)=>{
      this.run().then((result)=>{
        if(Array.isArray(result) && result.length && result[0]) {
          for(let k in result[0]) {
            if(result[0].hasOwnProperty(k)) {
              resolve(result[0][k]);
              break;
            }
          }
        }
      },reject)
    })
  }

  one(){
    this.count(1);
    return new Promise((resolve,reject)=>{
      this.run().then((result)=>{
        resolve(((res)=>{
          return Array.isArray(res) && res[0] ? res[0] : null;
        })(result));
      },reject);
    });
  }

  get(){
    return this.run();
  }
}

module.exports = (config) => {
  const MySqlConnection = {
    db:mysqlDriver.createConnection(config),
    connect:() => new Promise((resolve,reject)=>{
      MySqlConnection.db.connect((err)=>err ? reject(err) : resolve());
    }),
    request:() => new Database(MySqlConnection.db)
  };
  return MySqlConnection;
};