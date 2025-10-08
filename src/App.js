import React, { useState } from 'react';
import { Calculator, AlertCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GaussianCalculator = () => {
  const [size, setSize] = useState(4);
  const [matrix, setMatrix] = useState([
    ['1', '3', '5', '7'],
    ['5', '5', '7', '1'],
    ['3', '7', '1', '3'],
    ['7', '1', '3', '5']
  ]);
  const [vector, setVector] = useState(['22', '26', '22', '26']);
  const [result, setResult] = useState(null);
  const [conditionData, setConditionData] = useState([]);
  const [deviationData, setDeviationData] = useState([]);
  const [nParam, setNParam] = useState(5);

  const generateMatrix = () => {
    const n = nParam;
    const newMatrix = Array(n).fill().map((_, i) =>
      Array(n).fill().map((_, j) => (1 / (i + j + 1)).toString())
    );

    const newVector = newMatrix.map((row, i) => {
      return row.reduce((sum, val, j) => sum + Number(val) * Math.pow(j + 1, 2), 0).toString();
    });

    setSize(n);
    setMatrix(newMatrix);
    setVector(newVector);
  };

  const gaussianElimination = (A, b) => {
    const n = A.length;
    const augmented = [];
    for (let i = 0; i < n; i++) {
      augmented[i] = [];
      for (let j = 0; j < n; j++) {
        augmented[i][j] = Number(A[i][j]);
      }
      augmented[i][n] = Number(b[i]);
    }

    let det = 1;
    let swaps = 0;

    for (let col = 0; col < n; col++) {
      let maxRow = col;
      let maxVal = Math.abs(augmented[col][col]);

      for (let row = col + 1; row < n; row++) {
        if (Math.abs(augmented[row][col]) > maxVal) {
          maxVal = Math.abs(augmented[row][col]);
          maxRow = row;
        }
      }

      if (maxRow !== col) {
        const temp = augmented[col];
        augmented[col] = augmented[maxRow];
        augmented[maxRow] = temp;
        swaps++;
      }

      if (Math.abs(augmented[col][col]) < 1e-10) {
        return { error: "Система несумісна або має нескінченну кількість розв'язків" };
      }

      det *= augmented[col][col];

      for (let row = col + 1; row < n; row++) {
        const factor = augmented[row][col] / augmented[col][col];
        for (let j = col; j <= n; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }

    det *= (swaps % 2 === 0 ? 1 : -1);

    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= augmented[i][j] * x[j];
      }
      x[i] = sum / augmented[i][i];
    }

    return { solution: x, determinant: det, augmented };
  };

  const calculateInverse = (A) => {
    const n = A.length;
    const identity = Array(n).fill().map((_, i) =>
      Array(n).fill().map((_, j) => i === j ? 1 : 0)
    );

    const inverse = Array(n).fill().map(() => Array(n).fill(0));

    for (let col = 0; col < n; col++) {
      const result = gaussianElimination(A, identity.map(row => row[col]));
      if (result.error) return null;
      for (let row = 0; row < n; row++) {
        inverse[row][col] = result.solution[row];
      }
    }

    return inverse;
  };

  const matrixNorm = (A) => {
    return Math.max(...A.map(row =>
      row.reduce((sum, val) => sum + Math.abs(val), 0)
    ));
  };

  const conditionNumber = (A, AInv) => {
    return matrixNorm(A) * matrixNorm(AInv);
  };

  const solveSystem = () => {
    try {
      const A = matrix.map(row => row.map(Number));
      const b = vector.map(Number);

      if (A.some(row => row.some(isNaN)) || b.some(isNaN)) {
        setResult({ error: "Будь ласка, заповніть всі поля коректними числами" });
        return;
      }

      const gaussResult = gaussianElimination(A, b);
      if (gaussResult.error) {
        setResult({ error: gaussResult.error });
        return;
      }

      const inverse = calculateInverse(A);
      const cond = inverse ? conditionNumber(A, inverse) : null;

      setResult({
        solution: gaussResult.solution,
        determinant: gaussResult.determinant,
        inverse: inverse,
        conditionNumber: cond
      });
    } catch (error) {
      setResult({ error: "Помилка обчислення: " + error.message });
    }
  };

  const analyzeCondition = () => {
    const condData = [];
    const devData = [];

    for (let n = 2; n <= 10; n++) {
      const A = Array(n).fill().map((_, i) =>
        Array(n).fill().map((_, j) => 1 / (i + j + 1))
      );

      const exactSolution = Array(n).fill(1);
      const b = A.map(row =>
        row.reduce((sum, val, j) => sum + val * exactSolution[j], 0)
      );

      const gaussResult = gaussianElimination(A, b);

      if (!gaussResult.error) {
        const approximateSolution = gaussResult.solution;
        const deviation = Math.sqrt(
          exactSolution.reduce((sum, exact, i) => sum + Math.pow(exact - approximateSolution[i], 2), 0)
        );
        devData.push({ n, deviation });
      }

      const inverse = calculateInverse(A);
      if (inverse) {
        const cond = conditionNumber(A, inverse);
        condData.push({ n, conditionNumber: cond });
      }
    }

    setConditionData(condData);
    setDeviationData(devData);
  };


  const updateMatrixCell = (i, j, value) => {
    const newMatrix = [...matrix];
    newMatrix[i][j] = value;
    setMatrix(newMatrix);
  };

  const updateVectorCell = (i, value) => {
    const newVector = [...vector];
    newVector[i] = value;
    setVector(newVector);
  };

  const handleSizeChange = (newSize) => {
    const n = parseInt(newSize);
    setSize(n);
    setMatrix(Array(n).fill().map(() => Array(n).fill('')));
    setVector(Array(n).fill(''));
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Калькулятор методу Гаусса
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Розмір матриці (n×n):
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={size}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Параметр n для генерації:
              </label>
              <input
                type="number"
                value={nParam}
                onChange={(e) => setNParam(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateMatrix}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Згенерувати матрицю
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Матриця A:</h3>
              <div className="space-y-2">
                {matrix.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    {row.map((cell, j) => (
                      <input
                        key={j}
                        type="text"
                        value={cell}
                        onChange={(e) => updateMatrixCell(i, j, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Вектор b:</h3>
              <div className="space-y-2">
                {vector.map((cell, i) => (
                  <input
                    key={i}
                    type="text"
                    value={cell}
                    onChange={(e) => updateVectorCell(i, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={solveSystem}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-semibold"
            >
              Розв'язати систему
            </button>
            <button
              onClick={analyzeCondition}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 font-semibold"
            >
              Аналіз обумовленості
            </button>
          </div>
        </div>

        {result && !result.error && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Результати:</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Розв'язок x:</h3>
                <div className="bg-gray-50 p-4 rounded">
                  {result.solution.map((val, i) => (
                    <div key={i} className="mb-1">
                      x<sub>{i + 1}</sub> = {val.toFixed(6)}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Характеристики:</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div>
                    <strong>Визначник:</strong> {result.determinant.toFixed(6)}
                  </div>
                  {result.conditionNumber && (
                    <div>
                      <strong>Число обумовленості:</strong> {result.conditionNumber.toFixed(2)}
                      {result.conditionNumber > 100 && (
                        <div className="text-red-600 text-sm mt-1">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Погано обумовлена система!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {result.inverse && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Обернена матриця A⁻¹:</h3>
                <div className="bg-gray-50 p-4 rounded overflow-x-auto">
                  {result.inverse.map((row, i) => (
                    <div key={i} className="flex gap-4 mb-1 text-sm">
                      {row.map((val, j) => (
                        <span key={j} className="w-24">{val.toFixed(4)}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result && result.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">{result.error}</span>
            </div>
          </div>
        )}

        {conditionData.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Число обумовленості матриці
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conditionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="n" label={{ value: 'Розмір матриці n', position: 'insideBottom', offset: -10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="conditionNumber" stroke="#8b5cf6" strokeWidth={2} name="cond(A)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {deviationData.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Відхилення точного та наближеного розв'язку
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deviationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="n" label={{ value: 'Розмір матриці n', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="deviationNum" stroke="#ef4444" strokeWidth={2} name="||x_точне - x_наближене||" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default GaussianCalculator;