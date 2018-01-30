const { setupAccountRequest, deleteRequest } = require('./setup-account-request');
const { generateRedirectUri } = require('../authorise');
const { fapiFinancialIdFor } = require('../authorisation-servers');

const uuidv4 = require('uuid/v4');
const error = require('debug')('error');
const debug = require('debug')('debug');

const accountRequestAuthoriseConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const sessionId = req.headers['authorization'];
    const authorisationServerId = req.headers['x-authorization-server-id'];
    const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);

    debug(`authorisationServerId: ${authorisationServerId}`);
    const accountRequestId = await setupAccountRequest(authorisationServerId, fapiFinancialId);
    const interactionId = uuidv4();

    const uri = await generateRedirectUri(authorisationServerId, accountRequestId, 'openid accounts', sessionId, interactionId);

    debug(`authorize URL is: ${uri}`);
    return res.status(200).send({ uri }); // We can't intercept a 302 !
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

const accountRequestRevokeConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const sessionId = req.headers['authorization'];
    const authorisationServerId = req.headers['x-authorization-server-id'];
    const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);
    debug(`In accountRequestRevokeConsent authorisationServerId: ${authorisationServerId}`);
    const interactionId = uuidv4();
    const status = await deleteRequest(
      sessionId, authorisationServerId,
      fapiFinancialId, interactionId,
    );
    return res.sendStatus(status);
  } catch (err) {
    return res.sendStatus(400);
  }
};


exports.accountRequestAuthoriseConsent = accountRequestAuthoriseConsent;
exports.accountRequestRevokeConsent = accountRequestRevokeConsent;
