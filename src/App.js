import React, { useState } from 'react';
import { Calculator, Play, RefreshCw, Shuffle } from 'lucide-react';

const LinearSystemSolver = () => {
  const [n, setN] = useState(4);
  const [matrix, setMatrix] = useState([
    [15, 2, -1, 2],
    [2, 11, 2, -1],
    [-1, 2, 13, 3],
    [2, -1, 3, 17],
  ]);
  const [vector, setVector] = useState([18, 14, 17, 21]);
  const [epsilon, setEpsilon] = useState(0.001);
  const [omega, setOmega] = useState(1.2);
  const [results, setResults] = useState(null);

  const updateMatrix = (i, j, value) => {
    const newMatrix = matrix.map(row => [...row]);
    newMatrix[i][j] = parseFloat(value) || 0;
    setMatrix(newMatrix);
  };

  const updateVector = (i, value) => {
    const newVector = [...vector];
    newVector[i] = parseFloat(value) || 0;
    setVector(newVector);
  };

  const handleDimensionChange = (newN) => {
    const size = parseInt(newN);
    setN(size);
    setMatrix(Array.from({ length: size }, () => Array(size).fill(0)));
    setVector(Array(size).fill(0));
    setResults(null);
  };

  const generateRandom = (n) => {
    const A = Array.from({ length: n }, () => Array(n).fill(0));
    const b = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      let rowSum = 0;

      for (let j = 0; j < n; j++) {
        if (i !== j) {
          A[i][j] = Math.floor(Math.random() * 21 - 10);
          rowSum += Math.abs(A[i][j]);
        }
      }

      A[i][i] = rowSum + Math.floor(Math.random() * 10 + 1);

      b[i] = Math.floor(Math.random() * 21 - 10);
    }

    return { A, b };
  };


  const checkDiagonalDominance = (A) => {
    for (let i = 0; i < A.length; i++) {
      let sum = 0;
      for (let j = 0; j < A[i].length; j++) {
        if (i !== j) sum += Math.abs(A[i][j]);
      }
      if (Math.abs(A[i][i]) <= sum) return false;
    }
    return true;
  };

  const jacobiMethod = (A, b, eps) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let xNew = new Array(n).fill(0);
    let iter = 0;
    const maxIter = 10000;

    while (iter < maxIter) {
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          if (i !== j) sum += A[i][j] * x[j];
        }
        xNew[i] = (b[i] - sum) / A[i][i];
      }

      let error = xNew.reduce((acc, xi, i) => acc + Math.abs(xi - x[i]), 0);
      x = [...xNew];
      iter++;

      if (error < eps) break;
    }

    return { solution: x, iterations: iter };
  };

  const seidelMethod = (A, b, eps) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let iter = 0;
    const maxIter = 10000;

    while (iter < maxIter) {
      const xOld = [...x];
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          if (i !== j) sum += A[i][j] * x[j];
        }
        x[i] = (b[i] - sum) / A[i][i];
      }

      const error = x.reduce((acc, xi, i) => acc + Math.abs(xi - xOld[i]), 0);
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter };
  };

  const simpleIterationMethod = (A, b, eps) => {
    const n = A.length;
    const alpha = Array.from({ length: n }, () => Array(n).fill(0));
    const beta = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        alpha[i][j] = i === j ? 0 : -A[i][j] / A[i][i];
      }
      beta[i] = b[i] / A[i][i];
    }

    let x = [...beta];
    let iter = 0;
    const maxIter = 10000;

    while (iter < maxIter) {
      let xNew = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        xNew[i] = beta[i] + alpha[i].reduce((acc, aij, j) => acc + aij * x[j], 0);
      }

      const error = xNew.reduce((acc, xi, i) => acc + Math.abs(xi - x[i]), 0);
      x = xNew;
      iter++;

      if (error < eps) break;
    }

    return { solution: x, iterations: iter };
  };

  const sorMethod = (A, b, eps, w) => {
    const n = A.length;
    let x = Array(n).fill(0);
    let iter = 0;
    const maxIter = 10000;

    while (iter < maxIter) {
      const xOld = [...x];
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          if (i !== j) sum += A[i][j] * x[j];
        }
        x[i] = (1 - w) * x[i] + (w / A[i][i]) * (b[i] - sum);
      }

      const error = x.reduce((acc, xi, i) => acc + Math.abs(xi - xOld[i]), 0);
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter };
  };

  const solve = () => {
    if (!checkDiagonalDominance(matrix)) {
      alert('Матриця не має діагональної переваги!');
    }

    const jacobi = jacobiMethod(matrix, vector, epsilon);
    const seidel = seidelMethod(matrix, vector, epsilon);
    const simple = simpleIterationMethod(matrix, vector, epsilon);
    const sor = sorMethod(matrix, vector, epsilon, omega);

    setResults({ jacobi, seidel, simple, sor });
  };

  const resetExample = () => {
    setMatrix([
      [15, 2, -1, 2],
      [2, 11, 2, -1],
      [-1, 2, 13, 3],
      [2, -1, 3, 17],
    ]);
    setVector([18, 14, 17, 21]);
    setN(4);
    setEpsilon(0.001);
    setOmega(1.2);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Калькулятор ітераційних методів розв'язання СЛАР
            </h1>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <label className="font-medium text-gray-700">Розмірність n:</label>
            <select
              value={n}
              onChange={(e) => handleDimensionChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 19 }, (_, i) => i + 2).map((val) => (
                <option key={val} value={val}>
                  {val} × {val}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                const { A, b } = generateRandom(n);
                setMatrix(A);
                setVector(b);
                setResults(null);
              }}
              className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
            >
              <Shuffle className="w-5 h-5" />
              Згенерувати коефіцієнти
            </button>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-6 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Матриця коефіцієнтів A
              </h3>
              <div className="space-y-1 min-w-max">
                {matrix.map((row, i) => (
                  <div key={i} className="flex gap-1">
                    {row.map((val, j) => (
                      <input
                        key={j}
                        type="number"
                        value={val}
                        onChange={(e) => updateMatrix(i, j, e.target.value)}
                        className="w-16 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Вектор вільних членів b
                </h3>
                <div className="flex gap-1 flex-wrap">
                  {vector.map((val, i) => (
                    <input
                      key={i}
                      type="number"
                      value={val}
                      onChange={(e) => updateVector(i, e.target.value)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Параметри</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Точність ε
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={epsilon}
                      onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Параметр релаксації ω (для SOR)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={omega}
                      onChange={(e) => setOmega(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={solve}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              <Play className="w-5 h-5" />
              Розв'язати
            </button>
            <button
              onClick={resetExample}
              className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              Скинути до прикладу
            </button>
          </div>

          {results && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Результати</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results).map(([method, data]) => (
                  <div key={method} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3 text-indigo-700">
                      {method === 'jacobi'
                        ? 'Метод Якобі'
                        : method === 'seidel'
                          ? 'Метод Зейделя'
                          : method === 'simple'
                            ? 'Проста ітерація'
                            : `Верхня релаксація (ω = ${omega})`}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Ітерацій: {data.iterations}
                    </p>
                    {data.solution.map((x, i) => (
                      <p key={i} className="text-sm">
                        x<sub>{i + 1}</sub> = {x.toFixed(6)}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinearSystemSolver;
