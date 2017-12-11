const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';
const fapiInteractionId = 'interaction-1234';
const PAYMENT_SUBMISSION_ID = 'PS456';

describe('submitPayment called with authorisationServerId and fapiFinancialId', () => {
  const accessToken = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const resourcePath = `${resourceServer}/open-banking/v1.1`;
  const PaymentId = '88379';
  const idempotencyKey = '2023klf';
  const idempotencyKeyUnhappy = 'ee15fea57bacc37';
  let submitPaymentProxy;

  const PaymentsSubmissionSuccessResponse = () => ({
    Data: {
      PaymentSubmissionId: PAYMENT_SUBMISSION_ID,
      Status: 'AcceptedSettlementInProcess',
    },
  });

  const PaymentsSubmissionRejectedResponse = () => ({
    Data: {
      PaymentSubmissionId: PAYMENT_SUBMISSION_ID,
      Status: 'Rejected',
    },
  });

  const CreditorAccount = {
    SchemeName: 'SortCodeAccountNumber',
    Identification: '01122313235478',
    Name: 'Mr Kevin',
    SecondaryIdentification: '002',
  };

  const InstructedAmount = {
    Amount: '100.45',
    Currency: 'GBP',
  };

  const paymentsSuccessStub = sinon.stub().returns(PaymentsSubmissionSuccessResponse());
  const paymentsRejectedStub = sinon.stub().returns(PaymentsSubmissionRejectedResponse());
  const accessTokenAndResourcePathProxy = sinon.stub().returns({ accessToken, resourcePath });
  const retrievePaymentDetailsStub = sinon.stub().returns({
    PaymentId,
    CreditorAccount,
    InstructedAmount,
  });

  const setup = paymentStub => () => {
    submitPaymentProxy = proxyquire('../../app/submit-payment/submit-payment', {
      '../setup-request': { accessTokenAndResourcePath: accessTokenAndResourcePathProxy },
      '../setup-payment/payments': { postPayments: paymentStub },
      '../setup-payment/persistence': { retrievePaymentDetails: retrievePaymentDetailsStub },
    }).submitPayment;
  };

  describe('When Submitted Payment is in status AcceptedSettlementInProcess', () => {
    before(setup(paymentsSuccessStub));

    it('Returns PaymentSubmissionId from postPayments call', async () => {
      const id = await submitPaymentProxy(
        authorisationServerId, fapiFinancialId,
        idempotencyKey, fapiInteractionId,
      );
      assert.equal(id, PAYMENT_SUBMISSION_ID);
      assert.ok(paymentsSuccessStub.calledWithExactly(
        resourcePath,
        '/open-banking/v1.1/payment-submissions',
        {
          accessToken, fapiFinancialId, idempotencyKey, fapiInteractionId,
        },
        {
          PaymentId,
          CreditorAccount,
          InstructedAmount,
        },
      ));
    });
  });

  describe('When Submitted Payment is Rejected', () => {
    before(setup(paymentsRejectedStub));
    it('returns an error from postPayments call', async () => {
      try {
        await submitPaymentProxy(
          authorisationServerId, fapiFinancialId,
          idempotencyKeyUnhappy, fapiInteractionId,
        );
      } catch (err) {
        assert.equal(err.status, 500);
      }
    });
  });
});
