import React, { useState } from 'react';
import { Calculator, Play, RefreshCw, Shuffle, Info } from 'lucide-react';

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

  const rearrangeMatrix = (A, b) => {
    const n = A.length;
    const newA = A.map(row => [...row]);
    const newB = [...b];

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(newA[k][i]) > Math.abs(newA[maxRow][i])) {
          maxRow = k;
        }
      }

      if (maxRow !== i) {
        [newA[i], newA[maxRow]] = [newA[maxRow], newA[i]];
        [newB[i], newB[maxRow]] = [newB[maxRow], newB[i]];
      }

      if (Math.abs(newA[i][i]) < 1e-12) {
        return null;
      }
    }

    return { A: newA, b: newB };
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
          if (j !== i) sum += A[i][j] * x[j];
        }
        xNew[i] = (b[i] - sum) / A[i][i];
      }

      const error = Math.max(...xNew.map((xi, i) => Math.abs(xi - x[i])));
      x = [...xNew];
      iter++;

      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const seidelMethod = (A, b, eps) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let iter = 0;
    const maxIter = 10000;

    while (iter < maxIter) {
      const xOld = [...x];

      for (let i = 0; i < n; i++) {
        let sum1 = 0, sum2 = 0;
        for (let j = 0; j < i; j++) sum1 += A[i][j] * x[j];
        for (let j = i + 1; j < n; j++) sum2 += A[i][j] * xOld[j];

        x[i] = (b[i] - sum1 - sum2) / A[i][i];
      }

      const error = Math.max(...x.map((xi, i) => Math.abs(xi - xOld[i])));
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const simpleIterationMethod = (A, b, eps) => {
    const n = A.length;
    let x = new Array(n).fill(0);
    let iter = 0;
    const maxIter = 10000;

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

      const error = Math.max(...xNew.map((xi, i) => Math.abs(xi - x[i])));
      x = [...xNew];
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const sorMethod = (A, b, eps, omega) => {
    const n = A.length;
    let x = Array(n).fill(0);
    let iter = 0;
    const maxIter = 10000;

    while (iter < maxIter) {
      const xOld = [...x];

      for (let i = 0; i < n; i++) {
        let sum1 = 0, sum2 = 0;
        for (let j = 0; j < i; j++) sum1 += A[i][j] * x[j];
        for (let j = i + 1; j < n; j++) sum2 += A[i][j] * xOld[j];

        const xGaussSeidel = (b[i] - sum1 - sum2) / A[i][i];
        x[i] = (1 - omega) * xOld[i] + omega * xGaussSeidel;
      }

      const error = Math.max(...x.map((xi, i) => Math.abs(xi - xOld[i])));
      iter++;
      if (error < eps) break;
    }

    return { solution: x, iterations: iter, converged: iter < maxIter };
  };

  const solve = () => {
    let workMatrix = matrix.map(row => [...row]);
    let workVector = [...vector];

    const rearranged = rearrangeMatrix(workMatrix, workVector);

    if (rearranged === null) {
      alert('Неможливо переставити рядки так, щоб уникнути нулів на діагоналі! Система може бути виродженою.');
      return;
    }

    workMatrix = rearranged.A;
    workVector = rearranged.b;

    const jacobi = jacobiMethod(workMatrix, workVector, epsilon);
    const seidel = seidelMethod(workMatrix, workVector, epsilon);
    const simple = simpleIterationMethod(workMatrix, workVector, epsilon);
    const sor = sorMethod(workMatrix, workVector, epsilon, omega);

    setResults({ jacobi, seidel, simple, sor });
  };

  const studyOmega = () => {
    let workMatrix = matrix.map(row => [...row]);
    let workVector = [...vector];

    const rearranged = rearrangeMatrix(workMatrix, workVector);

    if (rearranged === null) {
      alert('Неможливо переставити рядки так, щоб уникнути нулів на діагоналі!');
      return;
    }

    workMatrix = rearranged.A;
    workVector = rearranged.b;

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

          {results && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Результати розв'язання</h2>

              <div className="bg-white p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Порівняння методів за кількістю ітерацій</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Якобі</p>
                    <p className="text-2xl font-bold text-indigo-600">{results.jacobi.iterations}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Зейделя</p>
                    <p className="text-2xl font-bold text-indigo-600">{results.seidel.iterations}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Проста ітерація</p>
                    <p className="text-2xl font-bold text-indigo-600">{results.simple.iterations}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Метод верхньої релаксації (ω={omega})</p>
                    <p className="text-2xl font-bold text-indigo-600">{results.sor.iterations}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results).map(([method, data]) => (
                  <div key={method} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3 text-indigo-700">
                      {method === 'jacobi'
                        ? 'Метод Якобі'
                        : method === 'seidel'
                          ? 'Метод Зейделя'
                          : method === 'simple'
                            ? 'Метод простої ітерації'
                            : `Метод верхньої релаксації (ω = ${omega})`}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Кількість ітерацій: <strong>{data.iterations}</strong>
                      {!data.converged && <span className="text-red-600"> (не збіглося)</span>}
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {data.solution.map((x, i) => (
                        <p key={i} className="text-sm font-mono">
                          x<sub>{i + 1}</sub> = {x.toFixed(8)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
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
                      omegaStudy.reduce((best, curr) =>
                        curr.iterations < best.iterations ? curr : best
                      ).omega
                    } ({
                      omegaStudy.reduce((best, curr) =>
                        curr.iterations < best.iterations ? curr : best
                      ).iterations
                    } ітерацій)
                  </p>
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
                      {omegaStudy.map((data, idx) => (
                        <tr key={idx} className={`border-b ${data.iterations === Math.min(...omegaStudy.map(d => d.iterations))
                          ? 'bg-green-50 font-bold'
                          : ''
                          }`}>
                          <td className="p-2">{data.omega.toFixed(2)}</td>
                          <td className="p-2">{data.iterations}</td>
                          <td className="p-2">
                            {data.converged
                              ? <span className="text-green-600">✓ Так</span>
                              : <span className="text-red-600">✗ Ні</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearSystemSolver;