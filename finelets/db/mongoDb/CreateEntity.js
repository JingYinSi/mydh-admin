const __ = require('underscore')

class Entity {
    constructor(config) {
        this.__config = config
    }

    update(data) {
        let __config = this.__config
        return __config.schema.findById(data.id)
            .then(doc => {
                if (doc && doc.modifiedDate.toJSON() === data.modifiedDate) {
                    __.each(__config.updatables, fld => {
                        if (__.isString(data[fld]) && data[fld].length === 0) doc[fld] = undefined
                        else doc[fld] = data[fld]
                    })
                    if (__config.setValues) __config.setValues(doc, data)
                    return doc.save()
                        .then(doc => {
                            return doc.toJSON()
                        })
                }
            })
    }

    ifUnmodifiedSince(id, version) {
        return this.__config.schema.findById(id)
            .then(doc => {
                if (doc) {
                    doc = doc.toJSON()
                    return doc.modifiedDate === version
                }
                return false
            })
    }

    search(cond, text) {
        let config = this.__config
        let filters = __.map(config.searchables, fld => {
            let filter = {}
            filter[fld] = {
                $regex: text,
                $options: 'si'
            }
            return filter
        })

        /* let notExists = __.map(config.searchables, fld => {
            let filter = {}
            filter[fld] = {
                $exists: false
            }
            return filter
        }) */

        let query = {
            $and: [cond, {
                $or: filters
            }]
        }
        return config.schema.find(query)
            .then(data => {
                return __.map(data, item => {
                    return item.toJSON()
                })
            })
    }
}

const __create = (config, addIn) => {
    const entity = new Entity(config)

    const obj = {
        search(cond, text) {
            return entity.search(cond, text)
        },
    
        ifUnmodifiedSince(id, version){
            return entity.ifUnmodifiedSince(id, version)
        },
        
        update(data){
            return entity.update(data)
        },
    
        ...addIn
    }

    return obj
}

module.exports = __create