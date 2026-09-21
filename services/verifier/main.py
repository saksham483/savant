import sys
import traceback
from typing import Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

app = FastAPI(title="SAVANT Verifier Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

transformations = standard_transformations + (implicit_multiplication_application,)

class MathVerifyRequest(BaseModel):
    user_input: str
    target_expression: str
    variable_names: Optional[List[str]] = Field(default_factory=lambda: ["x", "y", "z", "t", "n"])

class MathVerifyResponse(BaseModel):
    equivalent: bool
    simplified_input: Optional[str] = None
    simplified_target: Optional[str] = None
    difference_simplified: Optional[str] = None
    error: Optional[str] = None

class CodeVerifyRequest(BaseModel):
    code: str
    test_cases: List[dict] # [{"input": [...], "expected": ...}]
    function_name: Optional[str] = "solve"
    timeout_sec: Optional[float] = 2.0

class CodeVerifyResponse(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    failures: List[dict]
    error: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "savant-verifier", "sympy_version": sp.__version__}

@app.post("/verify/math", response_model=MathVerifyResponse)
def verify_math(req: MathVerifyRequest):
    """
    Checks mathematical algebraic equivalence between user input and target expression
    using SymPy expression simplification.
    """
    try:
        # Create symbols
        local_dict = {name: sp.Symbol(name) for name in req.variable_names}
        
        # Parse both expressions
        user_expr = parse_expr(req.user_input, local_dict=local_dict, transformations=transformations)
        target_expr = parse_expr(req.target_expression, local_dict=local_dict, transformations=transformations)
        
        # Check direct equality or simplified difference == 0
        diff = sp.simplify(user_expr - target_expr)
        is_eq = bool(diff == 0)
        
        # Double check using expand / factor
        if not is_eq:
            is_eq = bool(sp.expand(diff) == 0 or sp.factor(diff) == 0)
            
        return MathVerifyResponse(
            equivalent=is_eq,
            simplified_input=str(sp.simplify(user_expr)),
            simplified_target=str(sp.simplify(target_expr)),
            difference_simplified=str(diff)
        )
    except Exception as e:
        return MathVerifyResponse(
            equivalent=False,
            error=f"SymPy parse/eval error: {str(e)}"
        )

@app.post("/verify/code", response_model=CodeVerifyResponse)
def verify_code(req: CodeVerifyRequest):
    """
    Safely executes code in a restricted namespace against test cases.
    """
    scope = {}
    try:
        # Restricted builtins
        restricted_builtins = {
            "abs": abs, "min": min, "max": max, "sum": sum,
            "len": len, "range": range, "enumerate": enumerate,
            "zip": zip, "map": map, "filter": filter,
            "list": list, "dict": dict, "set": set, "tuple": tuple,
            "int": int, "float": float, "str": str, "bool": bool,
            "sorted": sorted, "reversed": reversed,
            "print": lambda *args: None # suppress print in sandbox
        }
        exec_env = {"__builtins__": restricted_builtins}
        
        # Execute user code
        exec(req.code, exec_env, scope)
        
        func = scope.get(req.function_name)
        if not func or not callable(func):
            return CodeVerifyResponse(
                all_passed=False,
                passed_count=0,
                total_count=len(req.test_cases),
                failures=[],
                error=f"Function '{req.function_name}' was not defined or is not callable."
            )
            
        passed = 0
        failures = []
        
        for idx, tc in enumerate(req.test_cases):
            tc_input = tc.get("input", [])
            expected = tc.get("expected")
            
            try:
                if isinstance(tc_input, list):
                    actual = func(*tc_input)
                elif isinstance(tc_input, dict):
                    actual = func(**tc_input)
                else:
                    actual = func(tc_input)
                    
                if actual == expected:
                    passed += 1
                else:
                    failures.append({
                        "test_index": idx,
                        "input": tc_input,
                        "expected": expected,
                        "actual": actual
                    })
            except Exception as ex:
                failures.append({
                    "test_index": idx,
                    "input": tc_input,
                    "expected": expected,
                    "actual": None,
                    "exception": str(ex)
                })
                
        return CodeVerifyResponse(
            all_passed=(passed == len(req.test_cases)),
            passed_count=passed,
            total_count=len(req.test_cases),
            failures=failures
        )
    except Exception as e:
        return CodeVerifyResponse(
            all_passed=False,
            passed_count=0,
            total_count=len(req.test_cases),
            failures=[],
            error=f"Execution error: {traceback.format_exc()}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
