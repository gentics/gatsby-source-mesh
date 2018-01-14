import crypto from 'crypto';
import {compose, join, pluck, map, path, forEach} from 'ramda';
import {singular} from 'pluralize';
import {SOURCE_NAME, DEBUG_MODE} from './constants';

// Get the type name back from a formatted type name.
export const extractTypeName = t => {
  /*
  t = singular(/(.+)(?:s|es)/gi.exec(t)[1]);
  if (t == "tagFamilie") {
    t = "tagFamilies";
  }
  */
  return t;
};

export const constructParentId = (e, type) => {
  if (type == "nodes" && e.parent && e.parent.uuid) {
    return e.parent.uuid;
  }
  return null;
};

export const constructChildIds = (e, type) => {
  if (e.children && e.children.elements) {
    return Object.values(e.children.elements).map(function(v) { return v.uuid; });
  } else  {
    return [];
  }
};

export const createNodes = (boundActionCreators, reporter) => (value, key) => {

  const {createNode, createParentChildLink} = boundActionCreators;

  key = extractTypeName(key);
  let relations = [];
  let nodes = {};
  forEach(queryResultNode => {

    // rename fields property since 'fields' is reserved by gatsby
    if (queryResultNode.fields)  {
      queryResultNode.data = queryResultNode.fields;
      delete queryResultNode.fields;
    }
    queryResultNode.id =  queryResultNode.uuid;

    const {id, ...fields} = queryResultNode;
    const jsonNode = JSON.stringify(queryResultNode);

    const gatsbyNode = {
      id: queryResultNode.uuid,
      ...fields,
      parent: constructParentId(queryResultNode, key),
      //children: constructChildIds(queryResultNode, key),
      children: [],
      internal: {
        type: key,
        content: jsonNode,
        contentDigest: crypto.createHash(`md5`).update(jsonNode).digest(`hex`)
      }
    };

    if (DEBUG_MODE) {
      const jsonFields = JSON.stringify(fields, null, 2);
      const jsonGatsbyNode = JSON.stringify(gatsbyNode, null, 2);
      reporter.info(`  processing node: ${jsonNode}`);
      reporter.info(`    node id ${id}`);
      reporter.info(`    node fields: ${jsonFields}`);
      reporter.info(`    gatsby node: ${jsonGatsbyNode}`);
    }

    createNode(gatsbyNode);

    if (key == "nodes") {
      let childrenIds = constructChildIds(queryResultNode, key);
      relations.push({"parentId": gatsbyNode.id, "childrenIds": childrenIds});
      nodes[gatsbyNode.id] = gatsbyNode;
    }
  }, value.elements);

  // Now that all nodes have been created we can setup the relations
  forEach(rel => {
    forEach(childId => {
      let child = nodes[childId];
      let parent = nodes[rel.parentId];
      if(child && parent) {
        createParentChildLink({ parent: parent, child: child });
      } else {
        reporter.warn("Unable to create parent-child relationship between " + rel.parent + " and " + childId);
      }
    }, rel.childrenIds);
  }, relations);


};
