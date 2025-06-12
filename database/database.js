import { Sequelize } from 'sequelize';

// This will create a SQLite database file named fitflow.sqlite in the backend folder
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './fitflow.sqlite'
});

export default sequelize;