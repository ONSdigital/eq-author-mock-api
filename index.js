const buildClientSchema = require('graphql').buildClientSchema;
const addMockFunctionsToSchema = require('graphql-tools').addMockFunctionsToSchema;
const merge = require('lodash').merge;

const graphqlSchema = require('eq-author-graphql-schema/author.graphqls');

export function mockSchema(mocks, preserveResolvers=false) {
    const schema = buildClientSchema(graphqlSchema);
    addMockFunctionsToSchema(merge({}, {mocks}, {preserveResolvers}));
    return schema;
};