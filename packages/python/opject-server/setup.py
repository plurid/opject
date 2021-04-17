import setuptools



with open("README.md", "r") as fh:
    long_description = fh.read()


setuptools.setup(
    name="opject-server",
    version="0.0.0",
    author="ly3xqhl8g9",
    author_email="ly3xqhl8g9@plurid.com",
    description="server for object passing",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/plurid/opject",
    packages=setuptools.find_packages(exclude=("tests",)),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
    install_requires=[
    ],
)
