# Error Central

	# For safety, create a nested bash session that you can exit from
	bash

	# The magic happens here
	exec 2> >(tee -a >(./ec))
