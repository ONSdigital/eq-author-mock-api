const schema = require('eq-author-graphql-schema/schema');

const { merge } = require('lodash');
const { mockServer } = require('graphql-tools');

const { MockNetworkInterface } = require('./index');

describe('mock API', () => {

    it('should be possible to create a mock network interface', () => {
        const networkInterface = new MockNetworkInterface(schema);
        expect(networkInterface).toBeInstanceOf(MockNetworkInterface);
    });

    describe('no overridden behaviours', () => {

        const server = mockServer(schema);

        it('should allow default implementation of the schema', () => {
            const query = `{
                questionnaires {
                    title                
                }
            }`;

            server.query(query).then(r => {
                const result = r.data;

                expect(result.questionnaires).toHaveLength(2);
                expect(result.questionnaires[0].title).toEqual("Hello World");
            }).catch(e => {
                console.error(e);
            });
        });

        it('should allow default implementation for more complex queries', () => {
            const query = `
                query GetQuestionnaire($questionnaireId: Int!) {
                  questionnaire(id: $questionnaireId) {
                    id
                    title
                    description
                    theme
                    legalBasis
                    navigation
                    sections {
                      id
                      title
                      description
                      pages {
                        ... on QuestionPage {
                          id
                          title
                          description
                          guidance
                          pageType
                          type
                          mandatory
                          answers {
                            id
                            description
                            guidance
                            qCode
                            label
                            type
                            mandatory
                          }
                        }
                      }
                    }
                  }
            }`;

            server.query(query, {questionnaireId: 1}).then(r => {
                const result = r.data;
                expect(['Voluntary', 'StatisticsOfTradeAct']).toContain(result.questionnaire.legalBasis);

                // Mocking should populate nested object data
                const sections = result.questionnaire.sections;
                expect(result.questionnaire.sections).toHaveLength(2);

                const validPageTypes = [
                    'InterstitialPage',
                    'QuestionPage'
                ];

                const mockPageType = sections[0].pages[0].pageType;
                expect(validPageTypes).toContain(mockPageType);

            }).catch(e => {
                console.error(e);
            });

        });

        it('should allow mutations to be mocked', () => {
            const query = `
                mutation UpdateQuestionnaire(
                    $id: Int!
                    $title: String!
                    $description: String!
                    $surveyId: String!
                    $theme: String!
                    $legalBasis: LegalBasis!
                    $navigation: Boolean
                  ) {
                    updateQuestionnaire(
                      id: $id
                      title: $title
                      description: $description
                      surveyId: $surveyId
                      theme: $theme
                      legalBasis: $legalBasis
                      navigation: $navigation
                    ) {
                      id
                      title
                      description
                      surveyId
                      theme
                      legalBasis
                      navigation
                    }
                  }
            `;

            const vars = {
                id: 1,
                title: "test",
                description: "description",
                surveyId: "1",
                theme: "default",
                legalBasis: "Voluntary"
            };

            server.query(query, vars).then(r => {
                const result = r.data.updateQuestionnaire;

                // Because we haven't specified the mock resolver functions the
                // mock resolver will generate some default data for us.
                expect(result.title).toEqual('Hello World');
                expect([true, false]).toContain(result.navigation);
            }).catch(e => {
                console.error(e);
            });

        });

    });

    describe('overriding the default behaviour', () => {

        const mocks = {
            Int: () => 99,
            Boolean: () => true,
            String: () => 'Survey title'
        };

        const server = mockServer(schema, mocks);

        it('should be possible to override the default built-in types', () => {
            const query = `{
                questionnaires {
                    id
                    title
                    navigation
                }
            }`;

            server.query(query).then(result => {
                const questionnaire = result.data.questionnaires[0];
                expect(questionnaire.id).toEqual(99);
                expect(questionnaire.title).toEqual('Survey title');
                expect(questionnaire.navigation).toBe(true);
            }).catch(e => {
                console.error(e);
            });

        });

    });

    describe('overriding specific resolver functions', () => {

        const mocks = {
            Query: () => ({
                questionnaires: () => [{
                    id: 1,
                    title: "something",
                    navigation: false
                }]
            })
        };

        const server = mockServer(schema, mocks);

        it('should be possible to override the default built-in types', () => {
            const query = `{
                questionnaires {
                    id
                    title
                    navigation
                }
            }`;

            server.query(query).then(result => {
                const questionnaire = result.data.questionnaires[0];

                expect(questionnaire.id).toEqual(1);
                expect(questionnaire.title).toEqual("something");
                expect(questionnaire.navigation).toBe(false);
            }).catch(e => {
                console.error(e);
            });

        });

    });

    describe('accessing variables in mocks', () => {

        const mocks = {
            Mutation: () => ({
                updateQuestionnaire: (root, args, ctx) => {
                    return merge({}, args);
                }
            })
        };

        const server = mockServer(schema, mocks);

        it('should be possible to access variables in the mock resolvers', () => {

            const query = `
                mutation UpdateQuestionnaire(
                    $id: Int!
                    $title: String!
                    $description: String!
                    $surveyId: String!
                    $theme: String!
                    $legalBasis: LegalBasis!
                    $navigation: Boolean
                  ) {
                    updateQuestionnaire(
                      id: $id
                      title: $title
                      description: $description
                      surveyId: $surveyId
                      theme: $theme
                      legalBasis: $legalBasis
                      navigation: $navigation
                    ) {
                      id
                      title
                      description
                      surveyId
                      theme
                      legalBasis
                      navigation
                    }
                  }
            `;

            const vars = {
                id: 99,
                title: "test",
                description: "description",
                surveyId: "1",
                theme: "default",
                legalBasis: "Voluntary"
            };

            server.query(query, vars).then(r => {
                const result = r.data.updateQuestionnaire;
                expect(result).toMatchObject(vars);
            }).catch(e => {
                console.error(e);
            });

        });

    });

});
