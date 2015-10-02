var mysql = require('mysql');
var Config = {};

var CONNECTION = false;

var ACTION_SELECT = 0;
var ACTION_INSERT = 1;
var ACTION_UPDATE = 2;
var ACTION_DELETE = 3;

var DEF_SECTION_NAME = 'section';

var MySqlMaster = function(){};

MySqlMaster.prototype.setDbInfo = function(conf){
    Config = conf;
    return this;
};

MySqlMaster.prototype.Action        = false;
MySqlMaster.prototype.condType      = 'AND';

MySqlMaster.prototype._table        = false;
MySqlMaster.prototype._psevdo_table = false;
MySqlMaster.prototype._distinict    = false;
MySqlMaster.prototype.condSection   = false;
MySqlMaster.prototype.mustRange     = false;

MySqlMaster.prototype._fields       = [];
MySqlMaster.prototype._order        = [];
MySqlMaster.prototype._group        = [];
MySqlMaster.prototype._join         = [];
MySqlMaster.prototype._conditions   = [];
MySqlMaster.prototype._condData     = [];

MySqlMaster.prototype.__DATA        = [];
MySqlMaster.prototype.__DUPL        = [];

MySqlMaster.prototype._from         = 0;
MySqlMaster.prototype._to           = 30;


MySqlMaster.prototype.Table = function(Table,Psevdo)
{
    this._table = Table;
    this._psevdo_table = Psevdo;
    this.__toDefaults();
};

MySqlMaster.prototype.__toDefaults = function()
{
    this.Action       = ACTION_SELECT;

    this._distinict   = false;
    this._from        = 0;
    this._to          = 30;
    this.condSection  = false;
    this.mustRange    = false;
    this.condType     = 'AND';

    this._fields      = [];
    this._order       = [];
    this._group       = [];
    this._join        = [];
    this._conditions  = [];
    this._condData    = [];
    this.__DATA       = [];
    this.__DUPL       = [];
    this.__genData    = [];
};

/* ------------------------------------------- ACTIONS ------------------------------------------- */
MySqlMaster.prototype.Select = function(Table,Psevdo)
{
    if(Table) this.Table(Table,Psevdo);
    this.Action = ACTION_SELECT;
    return this;
};

MySqlMaster.prototype.Insert = function(Table)
{
    if(Table) this.Table(Table);
    this.Action = ACTION_INSERT;
    return this;
};

MySqlMaster.prototype.Update = function(Table)
{
    if(Table) this.Table(Table);
    this.Action = ACTION_UPDATE;
    return this;
};

MySqlMaster.prototype.Delete = function(Table)
{
    if(Table) this.Table(Table);
    this.Action = ACTION_DELETE;
    return this;
};

/* -------------------------------------------- SYSTEM ------------------------------------------ */
MySqlMaster.prototype.field = function(field)
{
    this._fields.push(field); return this;
};

MySqlMaster.prototype._isEmptyObj = function(obj)
{
    for(var key in obj){return false;}
    return true;
};
MySqlMaster.prototype.getPsevdo = function(psevdo,wrap,col)
{
    var Ps = (!psevdo) ? (this._psevdo_table ? this._psevdo_table : this._table) : psevdo;
    if(col) {
        Ps = wrap ? '`' + Ps + '`.`' + col + '`' : Ps + '.' + col;
    } else {Ps = wrap ? '`' + Ps + '`' : Ps ;}
    return Ps;
};
MySqlMaster.prototype.__join = function(type,table,params,psevdo)
{
    if(table && params)
    {
        var Sql = type + ' JOIN `' + table + '`';
        if(psevdo) { Sql += ' AS `' + psevdo + '`' }

        if(params instanceof Array)
        {
            Sql+= ' ON(' + params.join(' AND ') + ')';
        } else {
            Sql += ' USING(`' + params + '`)';
        }
        this._join.push(Sql);
    }
};

MySqlMaster.prototype.addCondition = function(condition,data)
{
    this._conditions.push(condition);
    if(data && data.length)
    {
        if(this._condData.length) {
            this._condData = this._condData.concat(data);
        } else { this._condData = data; }
    }
};

MySqlMaster.prototype.__toExData = function(data)
{
    if(data.length)
    {
        this.__genData = this.__genData.length ? this.__genData.concat(data) : data;
    }
};

/* -------------------------------------------- PARTS ------------------------------------------- */
MySqlMaster.prototype.Fields = function(fields,psevdo)
{
    var Prefix = this.getPsevdo(psevdo,true);
    if(fields instanceof Array) {
        if(fields.length)
        {for(var cf = 0; cf<fields.length; cf++) { this.field(Prefix + '.`' + fields[cf] +'`'); }}
    } else {
        if(fields instanceof Object && !this._isEmptyObj(fields))
        {for(var k in fields){this.field(Prefix + '.`' + k +'` AS `' + fields[k] + '`');}}
    }
    return this;
};

MySqlMaster.prototype.Data = function(fields)
{
    this.__DATA.push(fields);
    return this;
};

MySqlMaster.prototype.Count = function(distinict,field,countName)
{
    field = field || 'id';
    field = this.getPsevdo(false,true,field);
    countName = countName || 'count';
    this.field('COUNT(' + (distinict ? 'DISTINCT ' : '') + field + ') as `' + countName + '`');
    return this;
};

MySqlMaster.prototype.Distinict = function(d)
{
    this._distinict = (d == undefined ? true : d);
    return this;
};

MySqlMaster.prototype.Range = function(from,count)
{
    if(from)
    {
        from = from < 0 ? 0 : from;
        if(!count){count = from;from = 0;}
        this._from = from;
        this._to = count;
        this.mustRange = true;
    }
    return this;
};

MySqlMaster.prototype.Order = function(col,order,psevdo)
{
    col = col || 'id';
    var ColName = (psevdo !== null) ? this.getPsevdo(psevdo,true,col) : '`' + col + '`';
    order = order || '>';
    if(order == '>') { order = 'desc'; }
    if(order == '<') { order = 'asc';  }
    order = order.toUpperCase();
    this._order.push(ColName + ' ' + order);
    return this;
};

MySqlMaster.prototype.Group = function(col,psevdo)
{
    this._group.push(this.getPsevdo(psevdo,true,col));
    return this;
};


MySqlMaster.prototype.InnerJoin = function(table,params,psevdo)
{
    this.__join('INNER',table,params,psevdo);
    return this;
};

MySqlMaster.prototype.LeftJoin = function(table,params,psevdo)
{
    this.__join('LEFT',table,params,psevdo);
    return this;
};

MySqlMaster.prototype.RightJoin = function(table,params,psevdo)
{
    this.__join('RIGHT',table,params,psevdo);
    return this;
};

MySqlMaster.prototype.startOr = function(section)
{
    section = section || DEF_SECTION_NAME;
    this.condSection = section;
    return this;
};

MySqlMaster.prototype.stopOr = function()
{
    this.condSection = false;
};

MySqlMaster.prototype.Condition = function(col,data,type,psevdo)
{
    if(col)
    {
        var Column = this.getPsevdo(psevdo,true,col);
        if(!data && data !==null) { this.addCondition(col); }
        else {
            if(data === null) { this.addCondition(Column + ' ' + ((!type || type=="is")?'IS NULL':'IS NOT NULL')); }
            else {
                var Condition;
                var ConditionData;

                if(data instanceof Array)
                {
                    type = type || 'in';
                    type.toLowerCase();
                    var Ps = [];
                    switch (type)
                    {
                        case 'in':
                        case '!in':
                        case '!':
                            for(var c=0;c<data.length;c++) {Ps.push('?');}
                            Condition = Column + ' ' + (type!='in' ? 'NOT ' : '') + 'IN';
                            Condition+='(' + Ps.join(',') + ')';
                            ConditionData = data;
                            break;
                        case 'or':
                            for(var c=0;c<data.length;c++) {
                                if(data[c]!==null) {Ps.push(Column + '=?');}
                                else {
                                    Ps.push(Column + ' IS NULL');
                                    data.splice(c,1);
                                }
                            }
                            Condition = '(' + Ps.join(' OR ') + ')';
                            ConditionData = data;
                            break;
                        case 'between':
                            Condition = '('+Column+' BETWEEN ? AND ?)';
                            ConditionData = data;
                            break;
                    }
                } else {
                    type = type || '=';
                    type.toLowerCase();
                    switch (type)
                    {
                        case '=':
                        case '!':
                        case '!=':
                            Condition = Column + ((type!='='?'!':'')) + '=?';
                            ConditionData = [data];
                            break;
                        case 'like':
                        case '%':
                            Condition = Column + ' LIKE ?';
                            data = type != 'like' ? '%' + data + '%' : data;
                            ConditionData = data;
                            break;
                        case '!in':
                            Condition = Column + ' NOT IN(' + data + ')';
                            break;
                    }
                }
                this.addCondition(Condition,ConditionData);
            }
        }
    }
    return this;
};

MySqlMaster.prototype.onDuplicate = function(data)
{
    this.__DUPL = data;
    return this;
};

/* --------------------------------------------- SQL -------------------------------------------- */
MySqlMaster.prototype.__genData = [];
MySqlMaster.prototype.__sql_Insert = function()
{
    if(this.__DATA.length)
    {
        var Sql = 'INSERT INTO `' + this._table + '` ';

        var Keys = [];
        var Valls =[];
        var Data = [];

        var Pattern = this.__DATA[0];
        for (var key in Pattern) {Keys.push(key);}
        Sql+= '(`' + Keys.join('`, `') + '`)';
        Sql+= ' VALUES ';

        for(var i=0;i<this.__DATA.length;i++)
        {
            var CurLine = '(';
            var CPP = [];
            for(key in Pattern){
                CPP.push('?');
                Data.push(this.__DATA[i][key]);
            }
            CurLine+=CPP.join(',');
            CurLine+=')';
            Valls.push(CurLine);
        }
        Sql+=Valls.join(',');
        Keys = Valls = Pattern = CurLine = CPP = null;

        if(!this._isEmptyObj(this.__DUPL))
        {
            Sql += ' ON DUPLICATE KEY UPDATE ';
            CPP = [];
            for(key in this.__DUPL)
            {
                CPP.push('`'+key+'`=?');
                Data.push(this.__DUPL[key]);
            }
            Sql += CPP.join(',');
            Keys = Valls = Pattern = CurLine = CPP = null;
        }
        Sql+=';';
        this.__genData = Data;
        return Sql;
    }
    return false;
};
/* ------------------------------------------- RESULTS ------------------------------------------ */
MySqlMaster.prototype.getSql = function()
{
    if(this.Action == ACTION_INSERT) { return this.__sql_Insert(); }
    else {
        var Sql = false;
        if(this.Action == ACTION_SELECT) {
            Sql = 'SELECT ';
            if(this._distinict) { Sql+= 'DISTINCT '; }
            if(this._fields.length) {
                Sql+= this._fields.join(', ');
            } else {Sql+='*';}

            Sql+=' FROM `' + this._table + '`';
            if(this._psevdo_table) { Sql+= ' AS `' + this._psevdo_table + '`'; }

            if(this._join.length) { Sql+=' ' + this._join.join(' '); }

        } else {
            if(this.Action == ACTION_UPDATE) {
                if(this.__DATA.length)
                {
                    Sql = 'UPDATE `' + this._table + '` SET ';
                    var Pattern = this.__DATA[0];
                    var ss = [];
                    var Data = [];
                    for(var key in Pattern) {
                        ss.push('`'+key+'`=?');
                        Data.push(Pattern[key]);
                    }
                    Sql+= ss.join(',');
                    this.__genData = Data;
                    Pattern = ss = Data = null;
                } else { return false; }
            }
            if(this.Action == ACTION_DELETE) {
                Sql = 'DELETE FROM `' + this._table + '`';
            }
        }

        if(this._conditions.length)
        {
            Sql+=' WHERE ' + this._conditions.join(' ' + this.condType + ' ');
            this.__toExData(this._condData);
        }

        if(this.Action == ACTION_SELECT)
        {
            if(this._group.length) { Sql+= ' GROUP BY ' + this._group.join(', '); }
            if(this._order.length) { Sql+= ' ORDER BY ' + this._order.join(', '); }
        }

        if(this.Action == ACTION_SELECT || this.mustRange)
        {
            Sql+=' LIMIT';
            if(this._from) { Sql+= ' '+this._from+','; }
            Sql+=' '+this._to;
        }
        Sql+=';';
    }
    return Sql;
};

MySqlMaster.prototype.Execute = function(closeConnection,callback)
{
    var Sql = this.getSql();
    if(Sql)
    {
        CONNECTION = CONNECTION || mysql.createConnection(Config);
        CONNECTION.query(Sql,this.__genData,function(err,rows){
            if(closeConnection) { CONNECTION.end(); }
            if(callback) { callback(err,rows); }
        });
    } else {
        if(callback) { callback('NO SQL',false); }
    }
};

MySqlMaster.prototype.GetArray = function(close,callback)
{
    this.Execute(close,callback);
};

MySqlMaster.prototype.GetOne = function(close,callback)
{
    this.Range(1);
    this.Execute(close,function(err,rows){
		rows = (rows.length) ? rows[0] : {};
        callback(err,rows);
    });
};

MySqlMaster.prototype.GetCell = function(close,callback)
{
    this.Execute(close,function(err,rows){
        if(!err && rows.length)
        {
            for(var k in rows[0])
            {
                callback(err,rows[0][k]);
                break;
            }
        }
    });
};

module.exports = new MySqlMaster();