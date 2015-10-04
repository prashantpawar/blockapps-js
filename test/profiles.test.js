describe("setProfile", function() {
    before(function() {
        profiles = setProfile.profiles;
    });
    after(function() {
        delete profiles
    });
    it("should contain 'hacknet' and 'ethereum' profiles", function() {
        expect(profiles).to.have.property("hacknet");
        expect(profiles).to.have.property("ethereum");
        expect(Object.keys(profiles.hacknet).sort()).to
            .eql(Object.keys(profiles.ethereum).sort());
    });
    it("should set the default values", function() {
        setProfile("ethereum", "2.0");
        var pE = profiles.ethereum;
        
        expect([
            polling.pollEveryMS, polling.pollTimeoutMS,
            query.serverURI, query.apiPrefix,
            txDefaults.gasPrice, txDefaults.gasLimit
        ]).to.eql([
            pE.pollEveryMS, pE.pollTimeoutMS,
            pE.serverURI, "/eth/v2.0",
            pE.gasPrice, pE.gasLimit
            
        ]);
        
        setProfile("hacknet", "1.0");
    });
});
