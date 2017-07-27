const MockNetworkInterface = require("./MockNetworkInterface");
const schema = require("eq-author-graphql-schema/schema");
const gql = require("graphql-tag");

describe("mock network interface", () => {

  describe('constructor', () => {

    it('should not be possible to initialise the mock API without a schema', () => {
      expect(() => new MockNetworkInterface()).toThrowError(/schema/);
    });

  });

  it("should be possible to query the mock network interface", () => {
    const api = new MockNetworkInterface(schema);

    const query = gql`
      {
        questionnaires {
          id
        }
      }
    `;

    const request = {
      query,
      variables: {}
    };

    api.query(request).then(result => {
      // If request query was passed to the mockServer implementation successfully then we should have
      // two questionnaires returned by default.
      expect(result.data.questionnaires).toHaveLength(2);
    });
  });
});
