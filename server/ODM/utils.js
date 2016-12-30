
function incGenerator(key)
{
    return function(cb)
    {
        var inc = { $inc: {} };
        inc.$inc[key] = 1;
        this.collection.update({_id:this._id},inc,function(err)
        {
            if(err && cb)
                return cb(err);
            else if(cb) return cb();
        })
    }
}

function setGenerator(key)
{
    return function(val,cb)
    {
        var addToSet = { $addToSet: {} };
        addToSet.$addToSet[key] = val;
        this.collection.update({_id:this._id},addToSet,function(err)
        {
            if(err && cb)
                return cb(err);
            else if(cb) return cb();
        })
    }
}

function pullGenerator(key)
{
    return function(val,cb)
    {
        var pull = { $pull: {} };
        pull.$pull[key] = val;
        this.collection.update({_id:this._id},pull,function(err)
        {
            if(err && cb)
                return cb(err);
            else if(cb) return cb();
        })
    }
}

exports.pullGenerator = pullGenerator;
exports.setGenerator = setGenerator;
exports.incGenerator = incGenerator;