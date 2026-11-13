Real payloads of GET /api/remote/wallet/me and /wallet/me/movements, produced by
the backend integration test BookingMoneyFlowIT
(theWalletApiPayloadMatchesTheOracleAndIsExportedForTheClients) after a
SYNTHETIC 100,000 RWF booking at a SYNTHETIC 1,000 RWF per USD. No real user or
money is involved.

Regenerate with:

    ./mvnw -Dverify.embeddedPg=true -Dtest=BookingMoneyFlowIT test

then copy target/contract/*.json here.
