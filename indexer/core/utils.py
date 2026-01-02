#!/usr/bin/env python3
"""
Utility functions.
"""
import hashlib

def compute_simhash(text: str, bits: int = 64) -> int:
    """
        Compute a SimHash fingerprint of 'text' using MD5-based feature hashing (case-sensitive).
        This function hashes each token in the text and aggregates the results into a fixed-size
        fingerprint of the specified number of bits.

        Args:
            text (str): The input text to compute the SimHash for.
            bits (int): The number of bits for the SimHash fingerprint. Default is 64

        Returns:
            int: The computed SimHash fingerprint as an integer.
        """
    v = [0] * bits
    for token in text.split():
        h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)
        for i in range(bits):
            v[i] += 1 if h & (1 << i) else -1
    fingerprint = 0
    for i, val in enumerate(v):
        if val >= 0:
            fingerprint |= (1 << i)
    return fingerprint
