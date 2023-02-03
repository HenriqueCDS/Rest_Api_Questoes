module.exports = (sequelize, DataTypes) => {
    const user = sequelize.define ("User", {
        nome: DataTypes.STRING,
        preco: DataTypes.STRING
    });
    
    return User;
}