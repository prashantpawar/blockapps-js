describe("setProfile", function() {
    before(function() {
        profiles = setProfile.profiles;
    });
    after(function() {
        delete profiles
    });
    it("should contain 'strato-dev' and 'strato-live' profiles", function() {
        expect(profiles).to.have.property("strato-dev");
        expect(profiles).to.have.property("strato-live");
        expect(Object.keys(profiles["strato-dev"]).sort()).to
            .eql(Object.keys(profiles["strato-live"]).sort());
    });
    it("should set the default values", function() {
        setProfile("strato-live", "2.0");
        var pE = profiles["strato-live"];
        
        expect([
            polling.pollEveryMS, polling.pollTimeoutMS,
            query.serverURI, query.apiPrefix,
            txDefaults.gasPrice, txDefaults.gasLimit
        ]).to.eql([
            pE.pollEveryMS, pE.pollTimeoutMS,
            pE.serverURI, "/eth/v2.0",
            pE.gasPrice, pE.gasLimit
            
        ]);
        
        setProfile("strato-dev", "1.0");
    });
});
