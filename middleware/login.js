const jwt = require('jsonwebtoken');
exports.required = (req, res, next) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_KEY);
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'Falha na autenticação', code: 46 });
    }

}

exports.optional = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_KEY);
        req.user = decode;
        next();
    } catch (error) {
        next();
    }

}

exports.requiredInsert = (req, res, next) => {
    const token = req.headers.hash;
    
    if (token == '60155a910f19f55e9b7bca565a765be5') {
        next();
    } else {
        return res.status(401).send({ message: 'Falha na autenticação', code: 46 });
    }

}