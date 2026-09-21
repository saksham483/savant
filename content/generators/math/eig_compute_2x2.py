import random
import sympy as sp

def generate_item(seed: int = 42):
    """
    Parametric generator for 2x2 integer eigenvalue problems.
    Constructs A = P D P^-1 with known integer eigenvalues.
    Verified with SymPy.
    """
    rng = random.Random(seed)
    
    # Choose distinct integer eigenvalues between -5 and 10
    e1 = rng.randint(-3, 5)
    e2 = e1 + rng.choice([-3, -2, -1, 1, 2, 3])
    
    # Diagonal matrix D
    D = sp.Matrix([[e1, 0], [0, e2]])
    
    # Construct invertible integer matrix P with det(P) = +-1 for clean integer matrices
    # [[a, b], [c, d]] with ad - bc = 1
    # Random shear or elementary matrix
    k = rng.choice([-2, -1, 1, 2])
    P = sp.Matrix([[1, k], [0, 1]])
    
    # Mix columns occasionally
    if rng.random() > 0.5:
        P = sp.Matrix([[1, 0], [k, 1]])
        
    A = P * D * P.inv()
    
    # Verify using SymPy
    computed_eigs = sorted([int(k) for k in A.eigenvals().keys()])
    target_eigs = sorted([e1, e2])
    assert computed_eigs == target_eigs, f"SymPy eigenvalue verification failed: {computed_eigs} != {target_eigs}"
    
    a, b = int(A[0, 0]), int(A[0, 1])
    c, d = int(A[1, 0]), int(A[1, 1])
    
    latex_matrix = f"\\begin{{pmatrix}} {a} & {b} \\\\ {c} & {d} \\end{{pmatrix}}"
    
    return {
        "id": f"gen-eig-{seed}",
        "skillId": "M2.10",
        "familyId": "eig-compute-2x2",
        "format": "computational",
        "difficulty": round(0.1 + abs(e1 - e2) * 0.1, 2),
        "seed": seed,
        "prompt": f"Find the eigenvalues of the matrix {latex_matrix}. Enter the values as a set or comma-separated list.",
        "latexPrompt": latex_matrix,
        "answerKey": {
            "type": "set-of-numbers",
            "value": target_eigs
        },
        "solution": f"The characteristic polynomial is det(A - \\lambda I) = ({a} - \\lambda)({d} - \\lambda) - ({b})({c}) = \\lambda^2 - {a+d}\\lambda + {a*d - b*c} = 0. Roots are \\lambda = {target_eigs[0]} and \\lambda = {target_eigs[1]}.",
        "provenance": "generator",
        "verifiedBy": ["sympy"],
        "status": "active"
    }

if __name__ == "__main__":
    # Test generator across seeds
    for s in range(10):
        item = generate_item(s)
        print(f"Seed {s}: {item['prompt']} -> {item['answerKey']['value']}")
