import React, { useState } from 'react';
import { Calculator, Play, RefreshCw, Shuffle, Info, AlertTriangle } from 'lucide-react';

const gaussElimination = (A, b) => {
  const n = A.length;
  let mat = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i; k < n; k++) {
      if (Math.abs(mat[k][i]) > Math.abs(mat[maxRow][i])) {
        maxRow = k;
      }
    }

    if (Math.abs(mat[maxRow][i]) < 1e-12) {
      return { solution: null, message: 'Singular matrix' };
    }

    [mat[i], mat[maxRow]] = [mat[maxRow], mat[i]];

    for (let k = i + 1; k < n; k++) {
      const c = -mat[k][i] / mat[i][i];
      for (let j = i; j <= n; j++) {
        if (j === i) mat[k][j] = 0;
        else mat[k][j] += c * mat[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = mat[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= mat[i][j] * x[j];
    }
    x[i] /= mat[i][i];
  }

  return { solution: x, message: null, converged: true, iterations: 'N/A (прямий метод)' };
};

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
  const [omegaRange, setOmegaRange] = useState({ min: 0.5, max: 1.9, step: 0.1 });
  const [results, setResults] = useState(null);
  const [omegaStudy, setOmegaStudy] = useState(null);
  const [matrixInfo, setMatrixInfo] = useState(null);

  const updateMatrix = (i, j, value) => {
    const newMatrix = matrix.map(row => [...row]);
    if (value === '' || value === '-') {
      newMatrix[i][j] = value;
    } else {
      const parsed = parseFloat(value);
      newMatrix[i][j] = isNaN(parsed) ? 0 : parsed;
    }
    setMatrix(newMatrix);
  };

  const updateVector = (i, value) => {
    const newVector = [...vector];
    if (value === '' || value === '-') {
      newVector[i] = value;
    } else {
      const parsed = parseFloat(value);
      newVector[i] = isNaN(parsed) ? 0 : parsed;
    }
    setVector(newVector);
  };

  const handleDimensionChange = (newN) => {
    const size = parseInt(newN);
    setN(size);
    setMatrix(Array.from({ length: size }, () => Array(size).fill(0)));
    setVector(Array(size).fill(0));
    setResults(null);
    setOmegaStudy(null);
    setMatrixInfo(null);
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

  const rearrangeMatrixForConvergence = (A, b) => {
    const n = A.length;
    const newA = A.map(row => [...row]);
    const newB = [...b];
    const usedRows = new Set();
    const finalA = Array(n).fill(null).map(() => Array(n).fill(0));
    const finalB = Array(n).fill(0);

    for (let col = 0; col < n; col++) {
      let bestRow = -1;
      let maxVal = -Infinity;

      for (let row = 0; row < n; row++) {
        if (!usedRows.has(row) && Math.abs(newA[row][col]) > maxVal) {
          maxVal = Math.abs(newA[row][col]);
          bestRow = row;
        }
      }

      if (bestRow === -1 || maxVal < 1e-12) {
        return null;
      }

      usedRows.add(bestRow);
      finalA[col] = newA[bestRow];
      finalB[col] = newB[bestRow];
    }

    return { A: finalA, b: finalB };
  };

  const checkDiagonalDominance = (A) => {
    const n = A.length;
    let strictCount = 0;
    let weakCount = 0;

    for (let i = 0; i < n; i++) {
      const diag = Math.abs(A[i][i]);
      const sum = A[i].reduce((s, val, j) => i !== j ? s + Math.abs(val) : s, 0);

      if (diag > sum) strictCount++;
      else if (diag >= sum) weakCount++;
    }

    return {
      isStrict: strictCount === n,
      isWeak: (strictCount + weakCount) === n,
      strictCount,
      weakCount,
      total: n
    };
  };

  const scaleMatrix = (A, b) => {
    const n = A.length;
    const scaledA = Array(n).fill(0).map(() => Array(n).fill(0));
    const scaledB = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      const rowMax = Math.max(...A[i].map(Math.abs));
      if (rowMax > 1e-12) {
        for (let j = 0; j < n; j++) {
          scaledA[i][j] = A[i][j] / rowMax;
        }
        scaledB[i] = b[i] / rowMax;
      } else {
        scaledA[i] = [...A[i]];
        scaledB[i] = b[i];
      }
    }

    return { A: scaledA, b: scaledB };
  };

  const addRegularization = (A, lambda = 0.01) => {
    const n = A.length;
    const regA = A.map((row, i) =>
      row.map((val, j) => i === j ? val + lambda : val)
    );
    return regA;
  };

  const estimateOptimalOmega = (A) => {
    const n = A.length;
    let maxRatio = 0;

    for (let i = 0; i < n; i++) {
      const diag = Math.abs(A[i][i]);
      if (diag < 1e-12) continue;

      const sum = A[i].reduce((s, val, j) => i !== j ? s + Math.abs(val) : s, 0);
      const ratio = sum / diag;
      maxRatio = Math.max(maxRatio, ratio);
    }

    if (maxRatio < 1) {
      const omega = 2 / (1 + Math.sqrt(1 - maxRatio * maxRatio));
      return Math.max(0.5, Math.min(omega, 1.95));
    }

    return 1.0;
  };

  const jacobiMethod = (A, b, eps, maxIter = 50000) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let xNew = new Array(n).fill(0);
    let iter = 0;

    while (iter < maxIter) {
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          if (j !== i) sum += A[i][j] * x[j];
        }
        xNew[i] = (b[i] - sum) / A[i][i];
      }

      if (xNew.some(val => !isFinite(val) || Math.abs(val) > 1e10)) {
        return { solution: x, iterations: iter, converged: false, diverged: true };
      }

      const error = Math.max(...xNew.map((xi, i) => Math.abs(xi - x[i])));
      x = [...xNew];
      iter++;

      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const seidelMethod = (A, b, eps, maxIter = 50000) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let iter = 0;

    while (iter < maxIter) {
      const xOld = [...x];

      for (let i = 0; i < n; i++) {
        let sum1 = 0, sum2 = 0;
        for (let j = 0; j < i; j++) sum1 += A[i][j] * x[j];
        for (let j = i + 1; j < n; j++) sum2 += A[i][j] * xOld[j];

        x[i] = (b[i] - sum1 - sum2) / A[i][i];
      }

      if (x.some(val => !isFinite(val) || Math.abs(val) > 1e10)) {
        return { solution: xOld, iterations: iter, converged: false, diverged: true };
      }

      const error = Math.max(...x.map((xi, i) => Math.abs(xi - xOld[i])));
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const simpleIterationMethod = (A, b, eps, maxIter = 50000) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let iter = 0;

    const alpha = Array.from({ length: n }, () => Array(n).fill(0));
    const beta = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) alpha[i][j] = -A[i][j] / A[i][i];
      }
      beta[i] = b[i] / A[i][i];
    }

    while (iter < maxIter) {
      const xNew = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        xNew[i] = beta[i];
        for (let j = 0; j < n; j++) {
          xNew[i] += alpha[i][j] * x[j];
        }
      }

      if (xNew.some(val => !isFinite(val) || Math.abs(val) > 1e10)) {
        return { solution: x, iterations: iter, converged: false, diverged: true };
      }

      const error = Math.max(...xNew.map((xi, i) => Math.abs(xi - x[i])));
      x = [...xNew];
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const sorMethod = (A, b, eps, omega, maxIter = 50000) => {
    const n = A.length;
    let x = Array(n).fill(0);
    let iter = 0;

    while (iter < maxIter) {
      const xOld = [...x];

      for (let i = 0; i < n; i++) {
        let sum1 = 0, sum2 = 0;
        for (let j = 0; j < i; j++) sum1 += A[i][j] * x[j];
        for (let j = i + 1; j < n; j++) sum2 += A[i][j] * xOld[j];

        const xGaussSeidel = (b[i] - sum1 - sum2) / A[i][i];
        x[i] = (1 - omega) * xOld[i] + omega * xGaussSeidel;
      }

      if (x.some(val => !isFinite(val) || Math.abs(val) > 1e10)) {
        return { solution: xOld, iterations: iter, converged: false, diverged: true };
      }

      const error = Math.max(...x.map((xi, i) => Math.abs(xi - xOld[i])));
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const adaptiveSOR = (A, b, eps, maxIter = 50000) => {
    const optimalOmega = estimateOptimalOmega(A);
    const result = sorMethod(A, b, eps, optimalOmega, maxIter);
    return { ...result, omega: optimalOmega, isAdaptive: true };
  };

  const solve = () => {
    let workMatrix = matrix.map(row => [...row]);
    let workVector = [...vector];
    let processingSteps = [];

    const rearranged = rearrangeMatrixForConvergence(workMatrix, workVector);

    if (rearranged === null) {
      alert('Неможливо переставити рядки так, щоб уникнути нулів на діагоналі! Система може бути виродженою.');
      return;
    }

    workMatrix = rearranged.A;
    workVector = rearranged.b;
    processingSteps.push('Перестановка рядків для максимізації діагоналі');

    const diagCheck = checkDiagonalDominance(workMatrix);

    if (!diagCheck.isStrict) {
      const scaled = scaleMatrix(workMatrix, workVector);
      workMatrix = scaled.A;
      workVector = scaled.b;
      processingSteps.push('Масштабування рядків матриці');
    }

    const diagCheckAfterScale = checkDiagonalDominance(workMatrix);
    let needsRegularization = false;

    if (!diagCheckAfterScale.isWeak) {
      workMatrix = addRegularization(workMatrix, 0.001);
      processingSteps.push('Додавання регуляризації (λ = 0.001)');
      needsRegularization = true;
    }

    const jacobi = jacobiMethod(workMatrix, workVector, epsilon);
    const seidel = seidelMethod(workMatrix, workVector, epsilon);
    const simple = simpleIterationMethod(workMatrix, workVector, epsilon);
    const sor = sorMethod(workMatrix, workVector, epsilon, omega);
    const adaptive = adaptiveSOR(workMatrix, workVector, epsilon);

    let tempResults = { jacobi, seidel, simple, sor, adaptive };

    setMatrixInfo({
      originalDiag: diagCheck,
      finalDiag: checkDiagonalDominance(workMatrix),
      processingSteps,
      needsRegularization,
      finalMatrix: workMatrix,
      finalVector: workVector
    });

    const allIterativeFailed = Object.values(tempResults).every(r => !r.converged);

    let gauss = null;
    if (allIterativeFailed) {
      const { solution, message, converged, iterations } = gaussElimination(workMatrix, workVector);
      gauss = { solution, iterations, converged, message, isDirect: true };
    }

    setResults({ ...tempResults, gauss });
  };

  const studyOmega = () => {
    let workMatrix = matrix.map(row => [...row]);
    let workVector = [...vector];

    const rearranged = rearrangeMatrixForConvergence(workMatrix, workVector);

    if (rearranged === null) {
      alert('Неможливо переставити рядки так, щоб уникнути нулів на діагоналі!');
      return;
    }

    workMatrix = rearranged.A;
    workVector = rearranged.b;

    const diagCheck = checkDiagonalDominance(workMatrix);
    if (!diagCheck.isStrict) {
      const scaled = scaleMatrix(workMatrix, workVector);
      workMatrix = scaled.A;
      workVector = scaled.b;
    }

    const omegaValues = [];
    for (let w = omegaRange.min; w <= omegaRange.max; w += omegaRange.step) {
      const result = sorMethod(workMatrix, workVector, epsilon, w);
      omegaValues.push({
        omega: parseFloat(w.toFixed(2)),
        iterations: result.iterations,
        converged: result.converged
      });
    }

    setOmegaStudy(omegaValues);
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
    setOmegaStudy(null);
    setMatrixInfo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Розв'язання СЛАР ітераційними методами
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
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
                setOmegaStudy(null);
                setMatrixInfo(null);
              }}
              className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
            >
              <Shuffle className="w-5 h-5" />
              Згенерувати систему
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
                        type="text"
                        inputMode="decimal"
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
                      type="text"
                      inputMode="decimal"
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
                      Параметр релаксації ω
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

          <div className="flex gap-4 mb-6 flex-wrap">
            <button
              onClick={solve}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              <Play className="w-5 h-5" />
              Розв'язати систему
            </button>
            <button
              onClick={resetExample}
              className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              Скинути до прикладу
            </button>
          </div>

          {matrixInfo && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-800 mb-2">Інформація про обробку матриці</h3>

                  <div className="space-y-2 text-sm text-yellow-700">
                    <div>
                      <strong>Початковий стан:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Строга діагональна перевага: {matrixInfo.originalDiag.isStrict ? '✓ Так' : '✗ Ні'}</li>
                        <li>Слабка діагональна перевага: {matrixInfo.originalDiag.isWeak ? '✓ Так' : '✗ Ні'}</li>
                        <li>Рядків з перевагою: {matrixInfo.originalDiag.strictCount} / {matrixInfo.originalDiag.total}</li>
                      </ul>
                    </div>

                    <div>
                      <strong>Виконані кроки обробки:</strong>
                      <ol className="list-decimal list-inside ml-4 mt-1">
                        {matrixInfo.processingSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <strong>Кінцевий стан:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Строга діагональна перевага: {matrixInfo.finalDiag.isStrict ? '✓ Так' : '✗ Ні'}</li>
                        <li>Рядків з перевагою: {matrixInfo.finalDiag.strictCount} / {matrixInfo.finalDiag.total}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Результати розв'язання</h2>

              <div className="bg-white p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Порівняння методів за кількістю ітерацій</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Якобі</p>
                    <p className={`text-2xl font-bold ${results.jacobi.converged ? 'text-indigo-600' : 'text-red-600'}`}>
                      {results.jacobi.iterations}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Зейделя</p>
                    <p className={`text-2xl font-bold ${results.seidel.converged ? 'text-indigo-600' : 'text-red-600'}`}>
                      {results.seidel.iterations}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Проста ітерація</p>
                    <p className={`text-2xl font-bold ${results.simple.converged ? 'text-indigo-600' : 'text-red-600'}`}>
                      {results.simple.iterations}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">SOR (ω={omega})</p>
                    <p className={`text-2xl font-bold ${results.sor.converged ? 'text-indigo-600' : 'text-red-600'}`}>
                      {results.sor.iterations}
                    </p>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-2">
                    <p className="text-sm text-gray-600">Адаптивний SOR</p>
                    <p className={`text-2xl font-bold ${results.adaptive.converged ? 'text-green-600' : 'text-red-600'}`}>
                      {results.adaptive.iterations}
                    </p>
                    <p className="text-xs text-gray-500">ω={results.adaptive.omega.toFixed(3)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results).filter(([method]) => method !== 'gauss').map(([method, data]) => (
                  <div key={method} className={`bg-white p-4 rounded-lg shadow ${data.isAdaptive ? 'border-2 border-green-400' : ''}`}>
                    <h3 className="text-lg font-semibold mb-3 text-indigo-700 flex items-center gap-2">
                      {method === 'jacobi'
                        ? 'Метод Якобі'
                        : method === 'seidel'
                          ? 'Метод Зейделя'
                          : method === 'simple'
                            ? 'Метод простої ітерації'
                            : method === 'adaptive'
                              ? 'Адаптивний SOR (автопідбір ω)'
                              : `Метод SOR (ω = ${omega})`}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Кількість ітерацій: <strong>{data.iterations}</strong>
                      {!data.converged && (
                        <span className="text-red-600 ml-2">
                          {data.diverged ? '(розбіжність)' : '(не збіглося)'}
                        </span>
                      )}
                      {data.converged && <span className="text-green-600 ml-2">✓ Збіглося</span>}
                    </p>
                    {data.isAdaptive && (
                      <p className="text-xs text-green-700 mb-2 bg-green-50 p-2 rounded">
                        Оптимальний ω = {data.omega.toFixed(4)}
                      </p>
                    )}
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {data.solution.map((x, i) => (
                        <p key={i} className="text-sm font-mono">
                          x<sub>{i + 1}</sub> = {isFinite(x) ? x.toFixed(8) : 'NaN'}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {results.gauss && (
                  <div className="bg-white p-4 rounded-lg shadow border-2 border-red-400">
                    <h3 className="text-lg font-semibold mb-3 text-red-700 flex items-center gap-2">
                      Метод Гаусса (прямий метод)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {results.gauss.message ? results.gauss.message : 'Розв\'язок знайдено'}
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {results.gauss.solution ? results.gauss.solution.map((x, i) => (
                        <p key={i} className="text-sm font-mono">
                          x<sub>{i + 1}</sub> = {isFinite(x) ? x.toFixed(8) : 'NaN'}
                        </p>
                      )) : <p className="text-red-600">Неможливо розв'язати (вироджена матриця)</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="font-bold text-green-800 mb-2">Рекомендація:</h4>
                <p className="text-sm text-green-700">
                  {(() => {
                    const converged = Object.entries(results).filter(([k, v]) => k !== 'gauss' && v.converged);
                    if (converged.length === 0) {
                      return 'Через те що матриця не має діагональної переваги, ітераційні методи не зійшлися. Застосовуємо метод Гаусса для розв\'язання.';
                    }
                    const best = converged.reduce((min, curr) =>
                      curr[1].iterations < min[1].iterations ? curr : min
                    );
                    const methodNames = {
                      jacobi: 'Метод Якобі',
                      seidel: 'Метод Зейделя',
                      simple: 'Метод простої ітерації',
                      sor: 'Метод SOR',
                      adaptive: 'Адаптивний SOR'
                    };
                    return `Найкращий результат показав ${methodNames[best[0]]} з ${best[1].iterations} ітераціями.`;
                  })()}
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Дослідження параметра ω для методу верхньої релаксації</h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ω мін
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={omegaRange.min}
                    onChange={(e) => setOmegaRange({ ...omegaRange, min: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ω макс
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={omegaRange.max}
                    onChange={(e) => setOmegaRange({ ...omegaRange, max: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Крок
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={omegaRange.step}
                    onChange={(e) => setOmegaRange({ ...omegaRange, step: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={studyOmega}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold mb-6"
            >
              <Calculator className="w-5 h-5" />
              Дослідити вплив параметра ω
            </button>

            {omegaStudy && (
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Результати дослідження</h3>

                <div className="bg-white p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Оптимальний параметр ω:</strong> {
                      (() => {
                        const converged = omegaStudy.filter(d => d.converged);
                        if (converged.length === 0) return 'Не знайдено збіжних значень';
                        const best = converged.reduce((best, curr) =>
                          curr.iterations < best.iterations ? curr : best
                        );
                        return `${best.omega} (${best.iterations} ітерацій)`;
                      })()
                    }
                  </p>
                  {matrixInfo && results?.adaptive && (
                    <p className="text-xs text-green-600 mt-2">
                      Автоматично розрахований оптимальний ω = {results.adaptive.omega.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left p-2">ω</th>
                        <th className="text-left p-2">Кількість ітерацій</th>
                        <th className="text-left p-2">Збіжність</th>
                      </tr>
                    </thead>
                    <tbody>
                      {omegaStudy.map((data, idx) => {
                        const converged = omegaStudy.filter(d => d.converged);
                        const isOptimal = converged.length > 0 &&
                          data.iterations === Math.min(...converged.map(d => d.iterations)) &&
                          data.converged;

                        return (
                          <tr key={idx} className={`border-b ${isOptimal ? 'bg-green-50 font-bold' : ''
                            }`}>
                            <td className="p-2">{data.omega.toFixed(2)}</td>
                            <td className="p-2">{data.converged ? data.iterations : '—'}</td>
                            <td className="p-2">
                              {data.converged
                                ? <span className="text-green-600">✓ Так</span>
                                : <span className="text-red-600">✗ Ні</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Візуалізація збіжності</h4>
                  <div className="relative h-48">
                    <svg className="w-full h-full" viewBox="0 0 500 200">
                      <line x1="50" y1="180" x2="480" y2="180" stroke="#999" strokeWidth="2" />
                      <line x1="50" y1="20" x2="50" y2="180" stroke="#999" strokeWidth="2" />

                      <text x="250" y="195" textAnchor="middle" fontSize="12" fill="#666">ω</text>
                      <text x="30" y="100" textAnchor="middle" fontSize="12" fill="#666" transform="rotate(-90 30 100)">Ітерації</text>

                      {(() => {
                        const converged = omegaStudy.filter(d => d.converged);
                        if (converged.length === 0) return null;

                        const maxIter = Math.max(...converged.map(d => d.iterations));
                        const minOmega = Math.min(...converged.map(d => d.omega));
                        const maxOmega = Math.max(...converged.map(d => d.omega));

                        const points = converged.map(d => {
                          const x = 50 + ((d.omega - minOmega) / (maxOmega - minOmega)) * 430;
                          const y = 180 - ((d.iterations / maxIter) * 160);
                          return { x, y, omega: d.omega, iter: d.iterations };
                        });

                        const pathData = points.map((p, i) =>
                          `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                        ).join(' ');

                        return (
                          <>
                            <path d={pathData} fill="none" stroke="#4f46e5" strokeWidth="2" />
                            {points.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#4f46e5">
                                <title>ω={p.omega.toFixed(2)}, ітерації={p.iter}</title>
                              </circle>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default LinearSystemSolver;