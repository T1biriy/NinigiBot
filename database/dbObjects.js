const Sequelize = require('sequelize');


const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database/database.sqlite',
});

const Users = require('./models/Users')(sequelize, Sequelize.DataTypes);
const Shinx = require('./models/Shinx')(sequelize, Sequelize.DataTypes)
const Equipments = require('./models/Equipments')(sequelize, Sequelize.DataTypes)
const Foods = require('./models/Foods')(sequelize, Sequelize.DataTypes)
const KeyItems = require('./models/KeyItems')(sequelize, Sequelize.DataTypes)
//const Room = require('./models/Room')(sequelize, Sequelize.DataTypes)
//const CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
const BattleItems = require('./models/BattleItems')(sequelize, Sequelize.DataTypes);

const UserItems = require('./models/UserItems')(sequelize, Sequelize.DataTypes);
const UserEquipments = require('./models/UserEquipments')(sequelize, Sequelize.DataTypes);
const UserFoods = require('./models/UserFoods')(sequelize, Sequelize.DataTypes);
const UserKeys = require('./models/UserKeys')(sequelize, Sequelize.DataTypes);
//const UserRooms = require('./models/UserRooms')(sequelize, Sequelize.DataTypes);
const EligibleRoles = require('./models/EligibleRoles')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(BattleItems, { foreignKey: 'item_id', as: 'item' });
UserEquipments.belongsTo(Equipments, { foreignKey: 'item_id', as: 'equipment' });
UserFoods.belongsTo(Foods, { foreignKey: 'item_id', as: 'food' });
UserKeys.belongsTo(KeyItems, { foreignKey: 'item_id', as: 'key' });
//UserRooms.belongsTo(Room, { foreignKey: 'item_id', as: 'room' });


BattleItems.prototype.toString = function () {
	let description = `${this.name}: ${this.cost}💰,`
	if(this.percentage) description+=` recovers ${this.percentage} points,`
	if(this.food) description+=` +${this.food} food,`
	if(this.sleep) description+=` +${this.sleep} sleep,`
	if(this.friendship) description+=` +${this.food} friendship,`
	if(this.geass) description+=` activates geass,`
	return description.slice(0, -1);
}

Equipments.prototype.toString = function () {
	let description = `${this.name}: ${this.cost}💰,`
	if(this.regen) description+=` recovers ${this.percentage} points per turn,`
	if(this.food) description+=` +${this.food} food,`
	if(this.sleep) description+=` +${this.sleep} sleep,`
	if(this.friendship) description+=` +${this.food} friendship,`
	if(this.guard) description+=` blocks one deathblow,`
	if(this.safeguard) description+=` blocks all deathblows,`
	if(this.geass) description+=` turn one geass,`
	if(this.ultrageass) description+=` permanent geass,`
	return description.slice(0, -1);
}

KeyItems.prototype.toString = function () {
	let description =`${this.name}: ${this.cost}💰`
	return description;
}

Foods.prototype.toString = function () {
	let description = `${this.name}: ${this.cost}💰, recovers ${this.recovery*100} points`
	return description;
}


Shinx.prototype.levelUp = function (experience) {
	this.level += experience;
	this.save();
	return this.level;
}

Shinx.prototype.changeNick = function (newNick) {
	this.nick = newNick;
	this.save();
	return this.nick;
}


Shinx.prototype.play = function (amount) {
	this.varyFriendship(0.05*amount)
	this.varySleep(-0.15)
	this.varyHunger(-0.15)
	this.save();
}

Shinx.prototype.feed = function (amount) {
	this.varyHunger(amount)
	this.varySleep(-0.1)
	this.save();
}

Shinx.prototype.varyHunger = function (amount) {
	this.hunger = Math.max(Math.min(1, this.hunger + amount), 0);
}

Shinx.prototype.varySleep = function (amount) {
	this.sleep = Math.max(Math.min(1, this.sleep + amount), 0);
}

Shinx.prototype.varyFriendship = function (amount) {
	this.friendship = Math.max(Math.min(1, this.friendship + amount), 0);
}
Shinx.prototype.shine = function () {
	this.shiny = !this.shiny
	this.save();
	return this.shiny;
}

Shinx.prototype.rest = function () {
	this.sleeping = true
	this.save();
}


Shinx.prototype.see = function () {
	const currentHour = Math.floor(Date.now()/(1000*60*60))
	const hoursPassed = currentHour - this.lastmeet
	if(this.sleep === 0) this.sleeping = true;
	if(hoursPassed===0) return;
	if(this.sleeping) this.sleep = Math.min(1, this.sleep+hoursPassed*0.1);
	else this.sleep = Math.max(0, this.sleep-hoursPassed*0.01);
	if(this.sleep === 1) this.sleeping = false;
	if(this.sleep === 0) this.sleeping = true;
	this.hunger = Math.max(0, this.hunger-hoursPassed*0.01);
	if(hoursPassed>=7*24) this.friendship = Math.max(0, this.friendship - 0.1*Math.trunc(hoursPassed/7*24))
	this.lastmeet = currentHour;
	this.save();
	return this.sleeping;
}

Shinx.prototype.trans = function () {
	this.user_male = !this.user_male
	this.save();
	return this.user_male;
}

Shinx.prototype.updateData = function (shinxBattle, wins=false) {
	this.level = shinxBattle.level
	this.exp = shinxBattle.exp
	//this.varyHunger(-0.1)
	//this.varySleep(-0.1)
	//wins? this.varyFriendship(0.04):this.varyFriendship(-0.02)
	this.save();
}

Shinx.prototype.equip = function (equipment) {
	this.equipment = equipment
	this.save();
}

Users.prototype.addItem = async function (item) {
	const useritem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (useritem) {
		useritem.amount += 1;
		return useritem.save();
	};

	return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
};

Users.prototype.removeItem = async function (item) {
	const useritem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (useritem) {
		useritem.amount -= 1;
		if (useritem.amount === 0) {
			useritem.destroy();
		} else {
			useritem.save();
		};
		return true;
	};
	return false;
};

Users.prototype.getItems = function () {
	return UserItems.findAll({
		where: { user_id: this.user_id },
		include: ['item'],
	});
};


Users.prototype.addFood = async function (food) {
	const userfood = await UserFoods.findOne({
		where: { user_id: this.user_id, item_id: food.id },
	});

	if (userfood) {
		userfood.amount += 1;
		return userfood.save();
	};

	return UserFoods.create({ user_id: this.user_id, item_id: food.id, amount: 1 });
};

Users.prototype.removeFood = async function (food) {
	const userfood = await UserFoods.findOne({
		where: { user_id: this.user_id, item_id: food.id },
	});

	if (userfood) {
		userfood.amount -= 1;
		if (userfood.amount === 0) {
			userfood.destroy();
		} else {
			userfood.save();
		};
		return true;
	};
	return false;
};

Users.prototype.getFoods = function () {
	return UserFoods.findAll({
		where: { user_id: this.user_id },
		include: ['food'],
	});
};

Users.prototype.addEquipment = async function (equipment) {
	const userequipment = await UserEquipments.findOne({
		where: { user_id: this.user_id, item_id: equipment.id },
	});

	if (!userequipment) {
		return UserEquipments.create({ user_id: this.user_id, item_id: equipment.id, amount: 1 });
	};

	
};

Users.prototype.getEquipments = function () {
	return UserEquipments.findAll({
		where: { user_id: this.user_id },
		include: ['equipment'],
	});
};
Users.prototype.addKey = async function (key) {
	const userkey = await UserKeys.findOne({
		where: { user_id: this.user_id, item_id: key.id },
	});

	if (!userkey) {
		return UserKeys.create({ user_id: this.user_id, item_id: key.id});
	};

	
};

Users.prototype.removeKey = async function (key) {
	const userkey = await UserKeys.findOne({
		where: { user_id: this.user_id, item_id: key.id },
	});

	if (userkey) {
		userkey.destroy();
		return true;
	};
	return false;
};

Users.prototype.getKeys = function () {
	return UserKeys.findAll({
		where: { user_id: this.user_id },
		include: ['key'],
	});
};

Users.prototype.addEquipment = async function (equipment) {
	const userequipment = await UserEquipments.findOne({
		where: { user_id: this.user_id, item_id: equipment.id },
	});

	if (!userequipment) {
		return UserEquipments.create({ user_id: this.user_id, item_id: equipment.id });
	};

	
};

Users.prototype.removeEquipment = async function (equipment) {
	const userequipment = await UserEquipments.findOne({
		where: { user_id: this.user_id, item_id: equipment.id },
	});

	if (userequipment) {
		userequipment.destroy();
		return true;
	};
	return false;
};

Users.prototype.getEquipments = function () {
	return UserEquipments.findAll({
		where: { user_id: this.user_id },
		include: ['equipment'],
	});
};

Users.prototype.changeRoom = async function (room) {
	const useroom = await UserRooms.findOne({
		where: { user_id: this.user_id },
	});
	if (!userequipment) {
		return UserEquipments.create({ user_id: this.user_id, item_id: room.id});
	};
	useroom.item_id = room.id;
	useroom.items = '';
	useroom.save();
};

Users.prototype.getRoom = function () {
	return UserRooms.findOne({
		where: { user_id: this.user_id },
		include: ['room'],
	});
};
module.exports = { Users, Equipments, Foods, KeyItems, BattleItems, UserItems,  UserEquipments, UserFoods, UserKeys, EligibleRoles, Shinx };

