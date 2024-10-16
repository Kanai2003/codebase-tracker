const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function parseFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'js', 'ts', 'tsx'],
  });

  const usageData = {
    functions: {},
    totalLines: code.split('\n').length, // Count total lines in the file
  };

  traverse(ast, {
    // Track function declarations
    FunctionDeclaration(path) {
      const functionName = path.node.id.name;
      usageData.functions[functionName] = { status: 'defined', line: path.node.loc.start.line, called: false, imported: false, totalCalls: 0 };
    },
    // Track function expressions (assigned to variables)
    VariableDeclarator(path) {
      if (path.node.init && (path.node.init.type === 'FunctionExpression' || path.node.init.type === 'ArrowFunctionExpression')) {
        const functionName = path.node.id.name;
        usageData.functions[functionName] = { status: 'defined', line: path.node.loc.start.line, called: false, imported: false, totalCalls: 0 };
      }
    },
    // Track function calls
    CallExpression(path) {
      const functionName = path.node.callee.name || (path.node.callee.object && path.node.callee.object.name);
      if (functionName) {
        if (!usageData.functions[functionName]) {
          usageData.functions[functionName] = { status: 'called', line: path.node.loc.start.line, totalCalls: 1 };
        } else {
          usageData.functions[functionName].called = true;
          usageData.functions[functionName].totalCalls += 1;
        }
      }
    },
    // Track imported functions
    ImportSpecifier(path) {
      const functionName = path.node.imported.name;
      usageData.functions[functionName] = { status: 'imported', line: path.node.loc.start.line, called: false, imported: true, totalCalls: 0 };
    },
    // Track functions passed as callbacks in chained calls
    Identifier(path) {
      const functionName = path.node.name;
      if (usageData.functions[functionName] && path.parent.type !== 'CallExpression') {
        usageData.functions[functionName].called = true;
        usageData.functions[functionName].totalCalls += 1;
      }
    }
  });

  return usageData;
}

module.exports = { parseFile };
