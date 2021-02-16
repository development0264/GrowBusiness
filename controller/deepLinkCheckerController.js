exports.deepLinkChecker = async function (req, res, callback) {
    res.sendFile('deepLink_checker.html', { root: 'DeepLink_check' });
}

exports.browserCheck = async function (req, res, callback) {
    res.sendFile('browserCheck.html', { root: 'DeepLink_check' });
}