// What-if Scenarios API tests
const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../server/app');

describe('What-If Scenarios API', () => {
  let authCookie;
  let testUser;
  let testScenario;
  let testVariation;

  before(async () => {
    // Create a test user and login
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'scenariotester',
        password: 'testpassword',
        name: 'Scenario Tester'
      });
    
    testUser = userResponse.body;
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'scenariotester',
        password: 'testpassword'
      });
    
    authCookie = loginResponse.headers['set-cookie'];
  });

  describe('Scenario CRUD Operations', () => {
    it('should create a new what-if scenario', async () => {
      const res = await request(app)
        .post('/api/what-if-scenarios')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Scenario',
          description: 'Test description for scenario',
          parameters: { 
            baseCost: 200000,
            complexity: 1.1,
            region: 'North'
          }
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
      expect(res.body.name).to.equal('Test Scenario');
      expect(res.body.userId).to.equal(testUser.id);
      expect(res.body.isSaved).to.equal(false);
      
      testScenario = res.body;
    });

    it('should get all what-if scenarios', async () => {
      const res = await request(app)
        .get('/api/what-if-scenarios')
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body.find(s => s.id === testScenario.id)).to.exist;
    });

    it('should get scenarios by user ID', async () => {
      const res = await request(app)
        .get(`/api/what-if-scenarios/user/${testUser.id}`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body.find(s => s.id === testScenario.id)).to.exist;
    });

    it('should get a specific what-if scenario', async () => {
      const res = await request(app)
        .get(`/api/what-if-scenarios/${testScenario.id}`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(testScenario.id);
      expect(res.body.name).to.equal(testScenario.name);
    });

    it('should update a what-if scenario', async () => {
      const res = await request(app)
        .patch(`/api/what-if-scenarios/${testScenario.id}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Scenario Name',
          description: 'Updated description'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(testScenario.id);
      expect(res.body.name).to.equal('Updated Scenario Name');
      expect(res.body.description).to.equal('Updated description');
      
      testScenario = res.body;
    });

    it('should save a what-if scenario', async () => {
      const res = await request(app)
        .post(`/api/what-if-scenarios/${testScenario.id}/save`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(testScenario.id);
      expect(res.body.isSaved).to.equal(true);
      
      testScenario = res.body;
    });
  });

  describe('Scenario Variations Operations', () => {
    it('should create a variation for a scenario', async () => {
      const res = await request(app)
        .post(`/api/what-if-scenarios/${testScenario.id}/variations`)
        .set('Cookie', authCookie)
        .send({
          name: 'Test Variation',
          scenarioId: testScenario.id,
          parameterKey: 'complexity',
          originalValue: 1.1,
          newValue: 1.3,
          impactValue: '15000',
          impactPercentage: '7.5'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
      expect(res.body.name).to.equal('Test Variation');
      expect(res.body.scenarioId).to.equal(testScenario.id);
      
      testVariation = res.body;
    });

    it('should get variations for a scenario', async () => {
      const res = await request(app)
        .get(`/api/what-if-scenarios/${testScenario.id}/variations`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body.find(v => v.id === testVariation.id)).to.exist;
    });

    it('should calculate scenario impact', async () => {
      const res = await request(app)
        .get(`/api/what-if-scenarios/${testScenario.id}/impact`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('totalImpact');
      expect(res.body).to.have.property('variations');
      expect(res.body.variations).to.be.an('array');
      expect(res.body.variations.length).to.be.at.least(1);
    });

    it('should delete a variation', async () => {
      const res = await request(app)
        .delete(`/api/what-if-scenarios/variations/${testVariation.id}`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(204);
      
      // Verify it's gone
      const checkRes = await request(app)
        .get(`/api/what-if-scenarios/${testScenario.id}/variations`)
        .set('Cookie', authCookie);
      
      expect(checkRes.body.find(v => v.id === testVariation.id)).to.not.exist;
    });
  });

  describe('Cleanup', () => {
    it('should delete a what-if scenario', async () => {
      const res = await request(app)
        .delete(`/api/what-if-scenarios/${testScenario.id}`)
        .set('Cookie', authCookie);
      
      expect(res.status).to.equal(204);
      
      // Verify it's gone
      const checkRes = await request(app)
        .get('/api/what-if-scenarios')
        .set('Cookie', authCookie);
      
      expect(checkRes.body.find(s => s.id === testScenario.id)).to.not.exist;
    });
  });
});