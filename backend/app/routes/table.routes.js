module.exports = app => {
    const table = require('../controllers/table.controller');
    const reservation = require('../controllers/reservation.controller');
    var router = require('express').Router();
    router.get('/available', table.getAvailableTables);
    router.post('/verify-pin', table.verifyPIN);
    router.post('/move-table', table.moveTable);
    router.post('/unmerge', table.unmergeTable);
    router.post('/unmerge-all', table.unmergeAllSlaves);
    router.get('/:qrCode', table.getTableByQRCode);
    router.post('/merge', table.mergeTable);
    router.post('/', table.addTable);
    router.put('/:id', table.updateTable);
    router.delete('/:id', table.deleteTable);
    router.get('/', table.getAllTables);
    router.put('/:id/start-using', table.startUsingTable);
    router.get('/:tableNumber/availability', reservation.checkTableAvailability);
    app.use('/api/tables', router);
};